-- LUCID managed-service foundation.
-- This migration is additive: it leaves the existing marketplace bookings,
-- messages, and provider profiles in place while the new flow is built.
-- Do not apply to the hosted Supabase project until its current schema and RLS
-- policies have been reviewed and the migration has been tested in a local DB.

create table if not exists public.lucid_staff_memberships (
  user_id uuid not null references auth.users(id) on delete restrict,
  role text not null check (
    role in ('hr', 'inspector', 'operations_admin', 'finance_admin', 'super_admin')
  ),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);

comment on table public.lucid_staff_memberships is
  'Server-managed LUCID staff roles. Users cannot grant or edit their own memberships.';

alter table public.lucid_staff_memberships enable row level security;
revoke all on public.lucid_staff_memberships from public, anon, authenticated;
grant select on public.lucid_staff_memberships to authenticated;

create policy "users can read their own LUCID memberships"
  on public.lucid_staff_memberships
  for select
  to authenticated
  using (user_id = (select auth.uid()));

create table if not exists public.managed_service_cases (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references auth.users(id) on delete restrict,
  service_slug text not null check (length(trim(service_slug)) between 1 and 120),
  service_name text not null check (length(trim(service_name)) between 1 and 160),
  description text not null check (length(trim(description)) between 1 and 4000),
  urgency text not null default 'normal' check (urgency in ('normal', 'urgent')),
  preferred_date date,
  preferred_time text,
  alternate_date date,
  alternate_time text,
  budget_min numeric(12, 2) not null check (budget_min >= 0),
  budget_max numeric(12, 2) not null check (budget_max >= budget_min),
  currency text not null default 'GHS' check (currency ~ '^[A-Z]{3}$'),
  status text not null default 'draft' check (
    status in (
      'draft',
      'submitted',
      'needs_information',
      'request_confirmed',
      'inspector_assigned',
      'inspection_scheduled',
      'inspection_reported',
      'scope_and_range_confirmed',
      'provider_offer_pending',
      'provider_assignment_confirmed',
      'work_in_progress',
      'work_ready',
      'final_invoice_pending_validation',
      'final_invoice_pending_client',
      'final_invoice_approved',
      'payment_pending',
      'payment_confirmed',
      'inspector_final_check',
      'completed',
      'cancelled',
      'resolved'
    )
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.managed_service_cases is
  'LUCID-owned service requests. Provider identity is stored in a separate assignment after acceptance.';
comment on column public.managed_service_cases.budget_min is
  'Client-entered expected lower range; informational budget, not a final quote.';
comment on column public.managed_service_cases.budget_max is
  'Client-entered expected upper range; informational budget, not a final charge cap.';

create index if not exists managed_service_cases_client_created_idx
  on public.managed_service_cases (client_id, created_at desc);
create index if not exists managed_service_cases_status_created_idx
  on public.managed_service_cases (status, created_at);

alter table public.managed_service_cases enable row level security;
revoke all on public.managed_service_cases from public, anon, authenticated;
grant select, delete on public.managed_service_cases to authenticated;
grant insert (
  client_id,
  service_slug,
  service_name,
  description,
  urgency,
  preferred_date,
  preferred_time,
  alternate_date,
  alternate_time,
  budget_min,
  budget_max,
  currency,
  status
) on public.managed_service_cases to authenticated;
-- Clients can only advance a draft to submitted; they cannot write lifecycle state.
grant update (status) on public.managed_service_cases to authenticated;

create policy "clients and authorized staff can read service cases"
  on public.managed_service_cases
  for select
  to authenticated
  using (
    client_id = (select auth.uid())
    or exists (
      select 1
      from public.lucid_staff_memberships as membership
      where membership.user_id = (select auth.uid())
        and membership.is_active
        and membership.role in ('hr', 'operations_admin', 'finance_admin', 'super_admin')
    )
    -- Legacy admin users can review the queue summary, but receive no private
    -- address/contact access unless separately granted an appropriate role.
    or exists (
      select 1
      from public.profiles as profile
      where profile.id = (select auth.uid())
        and profile.role = 'admin'
    )
  );

create policy "clients can create their own draft cases"
  on public.managed_service_cases
  for insert
  to authenticated
  with check (
    client_id = (select auth.uid())
    and status = 'draft'
    and exists (
      select 1
      from public.profiles as profile
      where profile.id = (select auth.uid())
        and profile.role = 'client'
    )
  );

create policy "clients can submit their own draft cases"
  on public.managed_service_cases
  for update
  to authenticated
  using (client_id = (select auth.uid()) and status = 'draft')
  with check (client_id = (select auth.uid()) and status = 'submitted');

create policy "clients can remove only their own draft cases"
  on public.managed_service_cases
  for delete
  to authenticated
  using (client_id = (select auth.uid()) and status = 'draft');

create table if not exists public.managed_case_private_details (
  case_id uuid primary key references public.managed_service_cases(id) on delete cascade,
  region text not null check (length(trim(region)) between 1 and 80),
  city text check (city is null or length(trim(city)) <= 120),
  street_address text not null check (length(trim(street_address)) between 1 and 240),
  area text not null check (length(trim(area)) between 1 and 120),
  landmark text check (landmark is null or length(trim(landmark)) <= 240),
  postal_code text check (postal_code is null or length(trim(postal_code)) <= 40),
  contact_name text not null check (length(trim(contact_name)) between 1 and 160),
  contact_phone text not null check (length(trim(contact_phone)) between 5 and 32),
  contact_email text check (contact_email is null or length(trim(contact_email)) <= 254),
  additional_notes text check (additional_notes is null or length(trim(additional_notes)) <= 2000),
  created_at timestamptz not null default now()
);

comment on table public.managed_case_private_details is
  'Client contact and exact location details. Provider-facing policies must never expose this table.';

alter table public.managed_case_private_details enable row level security;
revoke all on public.managed_case_private_details from public, anon, authenticated;
grant select on public.managed_case_private_details to authenticated;
grant insert (
  case_id,
  region,
  city,
  street_address,
  area,
  landmark,
  postal_code,
  contact_name,
  contact_phone,
  contact_email,
  additional_notes
) on public.managed_case_private_details to authenticated;

create policy "clients and authorized staff can read private case details"
  on public.managed_case_private_details
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.managed_service_cases as service_case
      where service_case.id = case_id
        and service_case.client_id = (select auth.uid())
    )
    or exists (
      select 1
      from public.managed_service_cases as service_case
      join public.lucid_staff_memberships as membership
        on membership.user_id = (select auth.uid())
      where service_case.id = managed_case_private_details.case_id
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

create policy "clients can add private details to their own draft case"
  on public.managed_case_private_details
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.managed_service_cases as service_case
      where service_case.id = case_id
        and service_case.client_id = (select auth.uid())
        and service_case.status = 'draft'
    )
  );
