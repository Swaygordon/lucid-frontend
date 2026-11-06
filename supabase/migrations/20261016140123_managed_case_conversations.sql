-- HISTORICAL DRAFT: reconcile this migration with docs/backend/BACKEND_WORKFLOW_IMPLEMENTATION_GUIDE.md and the deployed schema before applying.
-- It predates the final messaging model and is not approved for production application.
-- Client-to-LUCID case communication. Provider, inspector, and internal
-- conversations use separate audiences and are intentionally not exposed here.

alter table public.managed_case_notifications
  drop constraint if exists managed_case_notifications_event_type_check;

alter table public.managed_case_notifications
  add constraint managed_case_notifications_event_type_check
  check (event_type in (
    'inspector_assigned',
    'inspection_report_submitted',
    'case_message_received'
  ));

create table public.managed_case_messages (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.managed_service_cases(id) on delete restrict,
  sender_user_id uuid not null references auth.users(id) on delete restrict,
  sender_type text not null check (sender_type in ('client', 'lucid')),
  body text not null check (length(trim(body)) between 1 and 4000),
  created_at timestamptz not null default now()
);

comment on table public.managed_case_messages is
  'Private client-to-LUCID case thread. Providers and inspectors cannot read this audience.';

create index managed_case_messages_case_created_idx
  on public.managed_case_messages (case_id, created_at);

alter table public.managed_case_messages enable row level security;
revoke all on public.managed_case_messages from public, anon, authenticated;
-- Do not expose staff auth UUIDs to a client; the UI needs only the audience label.
grant select (id, case_id, sender_type, body, created_at) on public.managed_case_messages to authenticated;

create policy "clients and LUCID operations can read case messages"
  on public.managed_case_messages
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.managed_service_cases as service_case
      where service_case.id = managed_case_messages.case_id
        and service_case.client_id = (select auth.uid())
    )
    or exists (
      select 1
      from public.lucid_staff_memberships as membership
      where membership.user_id = (select auth.uid())
        and membership.is_active
        and membership.role in ('hr', 'operations_admin', 'super_admin')
    )
    or exists (
      select 1
      from public.profiles as profile
      where profile.id = (select auth.uid())
        and profile.role = 'admin'
    )
  );

-- Sending is a single trusted operation: validate the case audience, insert
-- the message, optionally request more information, and enqueue notifications.
create or replace function public.send_lucid_case_message(
  p_case_id uuid,
  p_body text,
  p_request_more_info boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := (select auth.uid());
  v_client_id uuid;
  v_case_status text;
  v_is_staff boolean := false;
  v_message_id uuid;
begin
  if v_actor_id is null then
    raise exception using errcode = '42501', message = 'Authentication is required.';
  end if;

  if p_body is null or length(trim(p_body)) = 0 or length(trim(p_body)) > 4000 then
    raise exception using errcode = '22023', message = 'Enter a message of up to 4000 characters.';
  end if;

  select service_case.client_id, service_case.status
    into v_client_id, v_case_status
    from public.managed_service_cases as service_case
   where service_case.id = p_case_id
   for update;

  if v_client_id is null then
    raise exception using errcode = 'P0002', message = 'The service request was not found.';
  end if;

  v_is_staff := exists (
    select 1
    from public.lucid_staff_memberships as membership
    where membership.user_id = v_actor_id
      and membership.is_active
      and membership.role in ('hr', 'operations_admin', 'super_admin')
  ) or exists (
    select 1
    from public.profiles as profile
    where profile.id = v_actor_id
      and profile.role = 'admin'
  );

  if v_actor_id <> v_client_id and not v_is_staff then
    raise exception using errcode = '42501', message = 'You cannot message this service request.';
  end if;

  if p_request_more_info and (not v_is_staff or v_case_status not in ('submitted', 'needs_information')) then
    raise exception using errcode = '42501', message = 'More information can only be requested by LUCID before inspection assignment.';
  end if;

  if v_case_status in ('completed', 'cancelled', 'resolved') then
    raise exception using errcode = '22023', message = 'This service request is closed.';
  end if;

  insert into public.managed_case_messages (case_id, sender_user_id, sender_type, body)
  values (p_case_id, v_actor_id, case when v_actor_id = v_client_id then 'client' else 'lucid' end, trim(p_body))
  returning id into v_message_id;

  if p_request_more_info then
    update public.managed_service_cases
       set status = 'needs_information', updated_at = now()
     where id = p_case_id;
  elsif v_actor_id = v_client_id and v_case_status = 'needs_information' then
    -- A client reply returns the request to HR review; it does not dispatch it.
    update public.managed_service_cases
       set status = 'submitted', updated_at = now()
     where id = p_case_id;
  end if;

  if v_actor_id = v_client_id then
    insert into public.managed_case_notifications (case_id, recipient_user_id, event_type, payload)
    select p_case_id, staff_user_id, 'case_message_received',
           jsonb_build_object('case_id', p_case_id, 'message_id', v_message_id)
      from (
        select distinct membership.user_id as staff_user_id
          from public.lucid_staff_memberships as membership
         where membership.is_active
           and membership.role in ('hr', 'operations_admin', 'super_admin')
        union
        select profile.id as staff_user_id
          from public.profiles as profile
         where profile.role = 'admin'
      ) as staff_recipients;
  else
    insert into public.managed_case_notifications (case_id, recipient_user_id, event_type, payload)
    values (
      p_case_id,
      v_client_id,
      'case_message_received',
      jsonb_build_object('case_id', p_case_id, 'message_id', v_message_id)
    );
  end if;

  return v_message_id;
end;
$$;

revoke all on function public.send_lucid_case_message(uuid, text, boolean) from public, anon, authenticated;
grant execute on function public.send_lucid_case_message(uuid, text, boolean) to authenticated;
