-- HISTORICAL DRAFT: reconcile this migration with docs/backend/BACKEND_WORKFLOW_IMPLEMENTATION_GUIDE.md and the deployed schema before applying.
-- It predates the final workflow and is not approved for production application.
-- Adds the first secure staff-to-inspector handoff.
-- Assignment is a single database transaction: a request cannot appear
-- assigned unless the inspection row and durable notification are committed.

create table public.lucid_inspector_roster (
  user_id uuid primary key references auth.users(id) on delete restrict,
  display_name text not null check (length(trim(display_name)) between 1 and 160),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

comment on table public.lucid_inspector_roster is
  'LUCID-managed roster used by authorized operations staff to assign field inspectors.';

alter table public.lucid_inspector_roster enable row level security;
revoke all on public.lucid_inspector_roster from public, anon, authenticated;
grant select on public.lucid_inspector_roster to authenticated;

create policy "operations can read the active inspector roster"
  on public.lucid_inspector_roster
  for select
  to authenticated
  using (
    is_active
    and (
      exists (
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
    )
  );

create table public.inspection_assignments (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.managed_service_cases(id) on delete restrict,
  inspector_user_id uuid not null references public.lucid_inspector_roster(user_id) on delete restrict,
  assigned_by uuid not null references auth.users(id) on delete restrict,
  status text not null default 'assigned' check (status in ('assigned', 'report_submitted', 'cancelled')),
  assigned_at timestamptz not null default now()
);

comment on table public.inspection_assignments is
  'Inspector assignments created by the authorized atomic dispatch function.';

create unique index inspection_assignments_one_active_per_case_idx
  on public.inspection_assignments (case_id)
  where status <> 'cancelled';
create index inspection_assignments_inspector_status_idx
  on public.inspection_assignments (inspector_user_id, status, assigned_at desc);

alter table public.inspection_assignments enable row level security;
revoke all on public.inspection_assignments from public, anon, authenticated;
grant select on public.inspection_assignments to authenticated;

create policy "assigned inspectors and operations can read assignments"
  on public.inspection_assignments
  for select
  to authenticated
  using (
    inspector_user_id = (select auth.uid())
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

create table public.inspection_reports (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null unique references public.inspection_assignments(id) on delete restrict,
  inspector_user_id uuid not null references auth.users(id) on delete restrict,
  findings text not null check (length(trim(findings)) between 1 and 4000),
  confirmed_scope text not null check (length(trim(confirmed_scope)) between 1 and 4000),
  materials_labor_notes text check (materials_labor_notes is null or length(trim(materials_labor_notes)) <= 3000),
  submitted_at timestamptz not null default now()
);

comment on table public.inspection_reports is
  'Initial field inspection findings for LUCID. Inspectors document scope and observations, not final invoice approval.';

alter table public.inspection_reports enable row level security;
revoke all on public.inspection_reports from public, anon, authenticated;
grant select on public.inspection_reports to authenticated;

create policy "inspectors and operations can read inspection reports"
  on public.inspection_reports
  for select
  to authenticated
  using (
    inspector_user_id = (select auth.uid())
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

create table public.managed_case_notifications (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.managed_service_cases(id) on delete restrict,
  recipient_user_id uuid not null references auth.users(id) on delete restrict,
  event_type text not null check (event_type in ('inspector_assigned', 'inspection_report_submitted')),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

comment on table public.managed_case_notifications is
  'Durable, minimal case events. Realtime or push delivery can be added without making delivery the source of truth.';

create index managed_case_notifications_recipient_idx
  on public.managed_case_notifications (recipient_user_id, created_at desc);

alter table public.managed_case_notifications enable row level security;
revoke all on public.managed_case_notifications from public, anon, authenticated;
grant select on public.managed_case_notifications to authenticated;

create policy "recipients can read their managed case notifications"
  on public.managed_case_notifications
  for select
  to authenticated
  using (recipient_user_id = (select auth.uid()));

-- An inspector may read only cases assigned to them. Existing client and staff
-- policies remain in place and continue to apply independently.
create policy "assigned inspectors can read their case summaries"
  on public.managed_service_cases
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.inspection_assignments as assignment
      where assignment.case_id = managed_service_cases.id
        and assignment.inspector_user_id = (select auth.uid())
        and assignment.status <> 'cancelled'
    )
  );

create policy "assigned inspectors can read private visit details"
  on public.managed_case_private_details
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.inspection_assignments as assignment
      where assignment.case_id = managed_case_private_details.case_id
        and assignment.inspector_user_id = (select auth.uid())
        and assignment.status <> 'cancelled'
    )
  );

-- SECURITY DEFINER is used only for this atomic transition. The function checks
-- the authenticated actor and target inspector itself, pins search_path, and
-- is executable only by signed-in users. No client can assign an inspector by
-- directly inserting an assignment or changing the case status.
create or replace function public.confirm_case_and_assign_inspector(
  p_case_id uuid,
  p_inspector_user_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := (select auth.uid());
  v_assignment_id uuid;
  v_case_id uuid;
begin
  if v_actor_id is null then
    raise exception using errcode = '42501', message = 'Authentication is required.';
  end if;

  if not exists (
    select 1
    from public.lucid_staff_memberships as membership
    where membership.user_id = v_actor_id
      and membership.is_active
      and membership.role in ('hr', 'operations_admin', 'super_admin')
  ) and not exists (
    select 1
    from public.profiles as profile
    where profile.id = v_actor_id
      and profile.role = 'admin'
  ) then
    raise exception using errcode = '42501', message = 'You cannot assign an inspector.';
  end if;

  if not exists (
    select 1
    from public.lucid_inspector_roster as inspector
    where inspector.user_id = p_inspector_user_id
      and inspector.is_active
  ) then
    raise exception using errcode = '22023', message = 'The selected inspector is not active.';
  end if;

  -- The conditional update both locks the row and prevents double assignment.
  update public.managed_service_cases
     set status = 'inspector_assigned', updated_at = now()
   where id = p_case_id
     and status = 'submitted'
  returning id into v_case_id;

  if v_case_id is null then
    raise exception using errcode = '40001', message = 'This request is no longer waiting for inspector assignment.';
  end if;

  insert into public.inspection_assignments (case_id, inspector_user_id, assigned_by)
  values (p_case_id, p_inspector_user_id, v_actor_id)
  returning id into v_assignment_id;

  -- This notification contains no client contact or location information.
  insert into public.managed_case_notifications (case_id, recipient_user_id, event_type, payload)
  values (
    p_case_id,
    p_inspector_user_id,
    'inspector_assigned',
    jsonb_build_object('case_id', p_case_id, 'assignment_id', v_assignment_id)
  );

  return v_assignment_id;
end;
$$;

revoke all on function public.confirm_case_and_assign_inspector(uuid, uuid) from public, anon, authenticated;
grant execute on function public.confirm_case_and_assign_inspector(uuid, uuid) to authenticated;

-- Inspectors submit one initial report per assignment. The report, status
-- transitions, and staff notifications commit together or not at all.
create or replace function public.submit_inspection_report(
  p_assignment_id uuid,
  p_findings text,
  p_confirmed_scope text,
  p_materials_labor_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := (select auth.uid());
  v_case_id uuid;
  v_report_id uuid;
begin
  if v_actor_id is null then
    raise exception using errcode = '42501', message = 'Authentication is required.';
  end if;

  select assignment.case_id
    into v_case_id
    from public.inspection_assignments as assignment
    join public.lucid_inspector_roster as inspector
      on inspector.user_id = assignment.inspector_user_id
   where assignment.id = p_assignment_id
     and assignment.inspector_user_id = v_actor_id
     and inspector.is_active
     and assignment.status = 'assigned'
   for update;

  if v_case_id is null then
    raise exception using errcode = '42501', message = 'This inspection is not assigned to you or is already submitted.';
  end if;

  insert into public.inspection_reports (
    assignment_id,
    inspector_user_id,
    findings,
    confirmed_scope,
    materials_labor_notes
  ) values (
    p_assignment_id,
    v_actor_id,
    trim(p_findings),
    trim(p_confirmed_scope),
    nullif(trim(p_materials_labor_notes), '')
  ) returning id into v_report_id;

  update public.inspection_assignments
     set status = 'report_submitted'
   where id = p_assignment_id
     and status = 'assigned';

  update public.managed_service_cases
     set status = 'inspection_reported', updated_at = now()
   where id = v_case_id
     and status = 'inspector_assigned';

  if not found then
    raise exception using errcode = '40001', message = 'The case changed while the inspection report was being submitted.';
  end if;

  insert into public.managed_case_notifications (case_id, recipient_user_id, event_type, payload)
  select v_case_id, membership.user_id, 'inspection_report_submitted',
         jsonb_build_object('case_id', v_case_id, 'report_id', v_report_id)
    from (
      select distinct staff_membership.user_id
      from public.lucid_staff_memberships as staff_membership
      where staff_membership.is_active
        and staff_membership.role in ('hr', 'operations_admin', 'super_admin')
    ) as membership;

  insert into public.managed_case_notifications (case_id, recipient_user_id, event_type, payload)
  select v_case_id, profile.id, 'inspection_report_submitted',
         jsonb_build_object('case_id', v_case_id, 'report_id', v_report_id)
    from public.profiles as profile
   where profile.role = 'admin'
     and not exists (
       select 1
       from public.lucid_staff_memberships as membership
       where membership.user_id = profile.id
         and membership.is_active
         and membership.role in ('hr', 'operations_admin', 'super_admin')
     );

  return v_report_id;
end;
$$;

revoke all on function public.submit_inspection_report(uuid, text, text, text) from public, anon, authenticated;
grant execute on function public.submit_inspection_report(uuid, text, text, text) to authenticated;
