begin;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'patient' check (role in ('patient', 'doctor')),
  unique (id, role)
);

-- Signup metadata is editable by the user. Only a trusted administrator sets a doctor role.
create schema if not exists private;
create function private.create_care_profile()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;
revoke all on function private.create_care_profile() from public, anon, authenticated;

create trigger create_care_profile_after_signup
after insert on auth.users
for each row execute function private.create_care_profile();

insert into public.profiles (id) select id from auth.users on conflict (id) do nothing;

create table public.patient_intakes (
  patient_id uuid primary key references public.profiles (id) on delete cascade,
  full_name text not null check (btrim(full_name) <> '' and char_length(full_name) <= 200),
  date_of_birth date check (date_of_birth <= current_date),
  phone text check (char_length(phone) <= 80),
  country text check (char_length(country) <= 120),
  care_details text not null check (btrim(care_details) <> '' and char_length(care_details) <= 8000),
  updated_at timestamptz not null default now()
);

create function private.stamp_care_intake()
returns trigger
language plpgsql set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
revoke all on function private.stamp_care_intake() from public, anon, authenticated;
create trigger stamp_care_intake_before_write
before insert or update on public.patient_intakes
for each row execute function private.stamp_care_intake();

create table public.doctor_patient_assignments (
  doctor_id uuid not null,
  patient_id uuid not null,
  -- Composite keys also enforce both roles when a profile or assignment changes.
  doctor_role text generated always as ('doctor'::text) stored,
  patient_role text generated always as ('patient'::text) stored,
  primary key (doctor_id, patient_id),
  foreign key (doctor_id, doctor_role) references public.profiles (id, role) on delete cascade,
  foreign key (patient_id, patient_role) references public.profiles (id, role) on delete cascade
);
create index doctor_patient_assignments_patient_idx on public.doctor_patient_assignments (patient_id);

alter table public.profiles enable row level security;
alter table public.patient_intakes enable row level security;
alter table public.doctor_patient_assignments enable row level security;

revoke all on public.profiles, public.patient_intakes, public.doctor_patient_assignments
  from public, anon, authenticated;
grant select on public.profiles, public.doctor_patient_assignments to authenticated;
grant select, insert, update on public.patient_intakes to authenticated;

create policy "Read own portal role" on public.profiles for select to authenticated
using (id = (select auth.uid()));

create policy "Doctors read their assignments" on public.doctor_patient_assignments for select to authenticated
using (doctor_id = (select auth.uid()));

create policy "Patients manage their intake" on public.patient_intakes for all to authenticated
using (
  patient_id = (select auth.uid())
  and exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'patient')
)
with check (
  patient_id = (select auth.uid())
  and exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'patient')
);

create policy "Assigned doctors read intake" on public.patient_intakes for select to authenticated
using (
  patient_id in (
    select a.patient_id from public.doctor_patient_assignments as a where a.doctor_id = (select auth.uid())
  )
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('patient-reports', 'patient-reports', false, 10485760, array['application/pdf', 'image/jpeg', 'image/png']);

-- Scope the grant to this bucket. Restrictive policies continue to protect reports
-- in projects that also have permissive policies for assets in other buckets.
create policy "Only administrators manage the reports bucket" on storage.buckets
as restrictive for all to anon, authenticated
using (id <> 'patient-reports') with check (id <> 'patient-reports');

create policy "Authenticated portal storage" on storage.objects for all to authenticated
using (bucket_id = 'patient-reports') with check (bucket_id = 'patient-reports');

create policy "Private reports require authentication" on storage.objects as restrictive for all to anon
using (bucket_id <> 'patient-reports') with check (bucket_id <> 'patient-reports');

-- The caller's intake SELECT policy covers both the patient and their assigned doctors.
create policy "Care team reads private reports" on storage.objects as restrictive for select to authenticated
using (
  bucket_id <> 'patient-reports'
  or exists (
    select 1 from public.patient_intakes as i where i.patient_id::text = split_part(name, '/', 1)
  )
);

create policy "Patients attach private reports" on storage.objects as restrictive for insert to authenticated
with check (
  bucket_id <> 'patient-reports' or (
    split_part(name, '/', 1) = (select auth.uid()::text)
    and name ~* '^[0-9a-f-]{36}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}--[a-z0-9_.-]+[.](pdf|jpe?g|png)$'
    and char_length(split_part(name, '/', 2)) <= 188
    and exists (select 1 from public.patient_intakes where patient_id = (select auth.uid()))
  )
);

create policy "Reports are immutable" on storage.objects as restrictive for update to authenticated
using (bucket_id <> 'patient-reports') with check (bucket_id <> 'patient-reports');

create policy "Patients remove their private reports" on storage.objects as restrictive for delete to authenticated
using (
  bucket_id <> 'patient-reports' or (
    split_part(name, '/', 1) = (select auth.uid()::text)
    and exists (select 1 from public.patient_intakes where patient_id = (select auth.uid()))
  )
);

commit;
