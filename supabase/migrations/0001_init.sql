-- ---------------------------------------------------------------------------
-- Neulens — Supabase / PostgreSQL baseline schema
--
-- Apply with:  supabase db push
--          or:  psql "$DATABASE_URL" -f supabase/migrations/0001_init.sql
--
-- Design notes
--   * Auth lives in Supabase Auth (auth.users). This file only adds the
--     application profile table and its clinical data.
--   * Every clinical table has RLS enabled. Patients see only their own rows;
--     clinicians see patients they are explicitly assigned to; institution
--     admins see the patients registered by their institution.
--   * No service-role key is ever required by the browser. Anything that must
--     bypass RLS (AI processing writes, batch jobs) runs in FastAPI with the
--     service-role key held server-side only.
-- ---------------------------------------------------------------------------

create extension if not exists "pgcrypto";
create extension if not exists "citext";

-- ---------------------------------------------------------------- enums -----

do $$ begin
  create type app_role as enum ('PATIENT', 'CLINICIAN', 'INSTITUTION', 'ADMIN');
exception when duplicate_object then null; end $$;

do $$ begin
  create type assessment_status as enum ('ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'ABORTED');
exception when duplicate_object then null; end $$;

do $$ begin
  create type review_status as enum ('PENDING_REVIEW', 'REVIEWED', 'FOLLOWUP_REQUIRED');
exception when duplicate_object then null; end $$;

do $$ begin
  create type change_status as enum ('INSUFFICIENT_DATA', 'NO_CHANGE', 'REVIEW');
exception when duplicate_object then null; end $$;

do $$ begin
  create type document_kind as enum ('REPORT', 'CONSENT', 'REFERRAL', 'ATTACHMENT');
exception when duplicate_object then null; end $$;

-- ------------------------------------------------------------- profiles -----
-- One row per auth.users row, created by trigger. Holds the role and the
-- clinical demographics that must not live in auth.users metadata (which is
-- visible to the user's own JWT).

create table if not exists public.profiles (
  id                  uuid primary key references auth.users (id) on delete cascade,
  role                app_role not null default 'PATIENT',
  name                text not null default '',
  email               citext,
  phone               text,
  patient_code        text unique,                     -- e.g. CV-2026-8F3K92
  date_of_birth       date,
  gender              text,
  preferred_language  text not null default 'en',
  education_years     int,
  handedness          text,
  institution_id      uuid,
  specialty           text,
  registration_number text,
  status              text not null default 'ACTIVE',  -- ACTIVE | SUSPENDED | WITHDRAWN
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

comment on column public.profiles.patient_code is
  'Hospital-facing patient identifier shown in the patient portal. Never the auth id.';

-- -------------------------------------------------------- institutions -----

create table if not exists public.institutions (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  kind                text,
  registration_number text,
  contact_person      text,
  city                text,
  created_at          timestamptz not null default now()
);

alter table public.profiles
  drop constraint if exists profiles_institution_fk;
alter table public.profiles
  add constraint profiles_institution_fk
  foreign key (institution_id) references public.institutions (id) on delete set null;

-- ------------------------------------------------- clinician assignments ----
-- Access to clinical records is explicit, not implied by role alone.

create table if not exists public.care_relationships (
  id            uuid primary key default gen_random_uuid(),
  clinician_id  uuid not null references public.profiles (id) on delete cascade,
  patient_id    uuid not null references public.profiles (id) on delete cascade,
  relationship  text not null default 'PRIMARY',   -- PRIMARY | CONSULTING | REFERRING
  created_at    timestamptz not null default now(),
  unique (clinician_id, patient_id)
);

-- -------------------------------------------------------- assessments ------

create table if not exists public.assessments (
  id            uuid primary key default gen_random_uuid(),
  patient_id    uuid not null references public.profiles (id) on delete cascade,
  clinician_id  uuid references public.profiles (id) on delete set null,
  performed_at  timestamptz not null default now(),
  assessment_type text not null default 'FULL_BATTERY',
  status        assessment_status not null default 'COMPLETED',
  review_status review_status not null default 'PENDING_REVIEW',
  reviewed_by   uuid references public.profiles (id) on delete set null,
  reviewed_at   timestamptz,
  overall_score numeric(5, 2),
  quality       jsonb not null default '{}'::jsonb,   -- audio/video/completion/comprehension/interruptions
  task_responses jsonb not null default '{}'::jsonb,
  baseline_id   uuid,
  created_at    timestamptz not null default now()
);

create index if not exists assessments_patient_time_idx
  on public.assessments (patient_id, performed_at desc);
create index if not exists assessments_review_idx
  on public.assessments (review_status) where review_status <> 'REVIEWED';

create table if not exists public.eye_metrics (
  assessment_id  uuid primary key references public.assessments (id) on delete cascade,
  reaction_time  numeric(8, 2),
  blink_rate     numeric(6, 2),
  fixation_score numeric(5, 2)
);

create table if not exists public.voice_metrics (
  assessment_id  uuid primary key references public.assessments (id) on delete cascade,
  speech_rate    numeric(6, 2),
  pause_score    numeric(5, 2),
  jitter         numeric(6, 3),
  shimmer        numeric(6, 3)
);

create table if not exists public.face_metrics (
  assessment_id  uuid primary key references public.assessments (id) on delete cascade,
  symmetry       numeric(5, 2),
  tremor_score   numeric(6, 2)
);

-- ---------------------------------------------------------- baselines -----

create table if not exists public.baselines (
  id               uuid primary key default gen_random_uuid(),
  patient_id       uuid not null references public.profiles (id) on delete cascade,
  established_at   timestamptz not null default now(),
  overall_score    numeric(5, 2) not null,
  cognitive_score  numeric(5, 2),
  functional_score numeric(5, 2),
  eye_score        numeric(5, 2),
  voice_score      numeric(5, 2),
  face_score       numeric(5, 2),
  context_score    numeric(5, 2),
  is_active        boolean not null default true,
  created_at       timestamptz not null default now()
);

create unique index if not exists baselines_one_active_per_patient
  on public.baselines (patient_id) where is_active;

alter table public.assessments
  drop constraint if exists assessments_baseline_fk;
alter table public.assessments
  add constraint assessments_baseline_fk
  foreign key (baseline_id) references public.baselines (id) on delete set null;

-- --------------------------------------------------- change detection -----

create table if not exists public.change_detections (
  id                 uuid primary key default gen_random_uuid(),
  patient_id         uuid not null references public.profiles (id) on delete cascade,
  baseline_id        uuid references public.baselines (id) on delete cascade,
  assessment_id      uuid references public.assessments (id) on delete set null,
  detected_at        timestamptz not null default now(),
  status             change_status not null default 'INSUFFICIENT_DATA',
  cognitive_change   numeric(6, 2),
  outside_baseline   boolean not null default false,
  review_reasons     jsonb not null default '[]'::jsonb,
  acknowledged_by    uuid references public.profiles (id) on delete set null,
  acknowledged_at    timestamptz
);

create index if not exists change_detections_patient_idx
  on public.change_detections (patient_id, detected_at desc);

-- ------------------------------------------------- reports & documents -----
-- Report text lives in Postgres; the signed PDF and scans live in Storage.
-- files.path is a Storage object path inside the private bucket, never a URL.

create table if not exists public.reports (
  id              uuid primary key default gen_random_uuid(),
  assessment_id   uuid not null unique references public.assessments (id) on delete cascade,
  patient_id      uuid not null references public.profiles (id) on delete cascade,
  author_id       uuid references public.profiles (id) on delete set null,
  recommendation  text not null default '',
  doctor_notes    text,
  generated_at    timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table if not exists public.documents (
  id            uuid primary key default gen_random_uuid(),
  patient_id    uuid not null references public.profiles (id) on delete cascade,
  assessment_id uuid references public.assessments (id) on delete set null,
  uploaded_by   uuid references public.profiles (id) on delete set null,
  kind          document_kind not null default 'ATTACHMENT',
  title         text not null,
  bucket        text not null default 'clinical-documents',
  path          text not null,
  mime_type     text,
  size_bytes    bigint,
  created_at    timestamptz not null default now(),
  unique (bucket, path)
);

create index if not exists documents_patient_idx
  on public.documents (patient_id, created_at desc);

-- --------------------------------------------------------- notifications ---
-- Realtime fan-out: the client subscribes to its own rows only.

create table if not exists public.notifications (
  id            uuid primary key default gen_random_uuid(),
  recipient_id  uuid not null references public.profiles (id) on delete cascade,
  patient_id    uuid references public.profiles (id) on delete cascade,
  audience      text not null default 'PATIENT',   -- PATIENT | CLINICIAN
  kind          text not null,
  title         text not null,
  body          text,
  payload       jsonb not null default '{}'::jsonb,
  read_at       timestamptz,
  created_at    timestamptz not null default now()
);

create index if not exists notifications_recipient_idx
  on public.notifications (recipient_id, created_at desc);

-- ------------------------------------------------------------- consent ----

create table if not exists public.consent_records (
  id            uuid primary key default gen_random_uuid(),
  patient_id    uuid not null references public.profiles (id) on delete cascade,
  scope         text not null,                     -- research | sharing | recording
  granted       boolean not null,
  recorded_at   timestamptz not null default now(),
  recorded_by   uuid references public.profiles (id) on delete set null,
  note          text
);

-- ------------------------------------------------------------- helpers ----

create or replace function public.current_role()
returns app_role
language sql
stable
security invoker
set search_path = public
as $$
  select coalesce(
    (select role from public.profiles where id = auth.uid()),
    'PATIENT'::app_role
  );
$$;

create or replace function public.is_clinician()
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('CLINICIAN', 'INSTITUTION', 'ADMIN')
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'ADMIN'
  );
$$;

-- Care relationship is checked with a SECURITY DEFINER function so the policy
-- itself does not need SELECT on care_relationships (avoids recursive RLS).
create or replace function public.can_access_patient(target uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    target = auth.uid()
    or public.is_admin()
    or exists (
      select 1 from public.care_relationships cr
      where cr.patient_id = target and cr.clinician_id = auth.uid()
    )
    or exists (
      select 1
      from public.profiles p
      join public.profiles me on me.id = auth.uid()
      where p.id = target
        and me.role in ('INSTITUTION', 'ADMIN')
        and me.institution_id is not null
        and p.institution_id = me.institution_id
    );
$$;

revoke all on function public.can_access_patient(uuid) from public;
grant execute on function public.can_access_patient(uuid) to authenticated;

-- Safe cast for storage paths such as '<patient-uuid>/report.pdf'.
create or replace function public.try_uuid(value text)
returns uuid
language plpgsql
immutable
as $$
begin
  return value::uuid;
exception when invalid_text_representation then
  return null;
end;
$$;

-- ------------------------------------------------------- maintenance ------

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch
  before update on public.profiles
  for each row execute function public.touch_updated_at();

drop trigger if exists reports_touch on public.reports;
create trigger reports_touch
  before update on public.reports
  for each row execute function public.touch_updated_at();

-- Create the profile row automatically when Supabase Auth creates a user.
--
-- Every new account starts as PATIENT. A user must never be able to choose
-- their own role at sign-up: client-supplied metadata is attacker-controlled
-- and a clinician role grants access to other people's records. Clinician and
-- institution roles are assigned after credential verification by an admin
-- using the service role (or the `promote_role` function below).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, name, email, phone, preferred_language)
  values (
    new.id,
    'PATIENT'::app_role,
    coalesce(new.raw_user_meta_data ->> 'name', ''),
    new.email,
    new.phone,
    coalesce(new.raw_user_meta_data ->> 'language', 'en')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

-- Admin-only role assignment. Runs as definer so it bypasses RLS, and checks
-- the caller is an admin against the stored profile rather than a claim.
create or replace function public.promote_role(target uuid, new_role app_role)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Only administrators can change account roles.'
      using errcode = '42501';
  end if;

  update public.profiles set role = new_role where id = target;
end;
$$;

revoke all on function public.promote_role(uuid, app_role) from public;
grant execute on function public.promote_role(uuid, app_role) to authenticated;

-- Role and status are immutable for the account owner.
create or replace function public.guard_profile_privileges()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (new.role is distinct from old.role or new.status is distinct from old.status)
     and not public.is_admin() then
    raise exception 'Role and account status changes require an administrator.'
      using errcode = '42501';
  end if;
  if new.patient_code is distinct from old.patient_code and not public.is_clinician() then
    raise exception 'Patient identifiers are issued by the hospital, not the account owner.'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_guard_privileges on public.profiles;
create trigger profiles_guard_privileges
  before update on public.profiles
  for each row execute function public.guard_profile_privileges();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------- RLS --------

alter table public.profiles            enable row level security;
alter table public.institutions        enable row level security;
alter table public.care_relationships  enable row level security;
alter table public.assessments         enable row level security;
alter table public.eye_metrics         enable row level security;
alter table public.voice_metrics       enable row level security;
alter table public.face_metrics        enable row level security;
alter table public.baselines           enable row level security;
alter table public.change_detections   enable row level security;
alter table public.reports             enable row level security;
alter table public.documents           enable row level security;
alter table public.notifications       enable row level security;
alter table public.consent_records     enable row level security;

-- profiles: everyone reads themself; clinicians read their assigned patients;
-- admins read everything. Updates are limited to the owner's own row.
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.can_access_patient(id));

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists profiles_admin_all on public.profiles;
create policy profiles_admin_all on public.profiles
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- institutions: readable by their own members, writable by admins only.
drop policy if exists institutions_select on public.institutions;
create policy institutions_select on public.institutions
  for select to authenticated
  using (
    public.is_clinician()
    and exists (
      select 1 from public.profiles me
      where me.id = auth.uid() and me.institution_id = institutions.id
    )
  );

drop policy if exists institutions_admin on public.institutions;
create policy institutions_admin on public.institutions
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- care relationships: visible to the two parties, managed by clinicians/admins.
drop policy if exists care_relationships_select on public.care_relationships;
create policy care_relationships_select on public.care_relationships
  for select to authenticated
  using (clinician_id = auth.uid() or patient_id = auth.uid() or public.is_admin());

drop policy if exists care_relationships_write on public.care_relationships;
create policy care_relationships_write on public.care_relationships
  for all to authenticated
  using (public.is_clinician())
  with check (public.is_clinician());

-- assessments and their metric rows: patient owns, clinician with access reads.
-- Writes go through the AI service or the clinician review flow.

drop policy if exists assessments_select on public.assessments;
create policy assessments_select on public.assessments
  for select to authenticated
  using (public.can_access_patient(patient_id));

drop policy if exists assessments_patient_insert on public.assessments;
create policy assessments_patient_insert on public.assessments
  for insert to authenticated
  with check (patient_id = auth.uid());

drop policy if exists assessments_clinician_update on public.assessments;
create policy assessments_clinician_update on public.assessments
  for update to authenticated
  using (public.can_access_patient(patient_id) and public.is_clinician())
  with check (public.can_access_patient(patient_id) and public.is_clinician());

drop policy if exists eye_metrics_select on public.eye_metrics;
create policy eye_metrics_select on public.eye_metrics
  for select to authenticated
  using (exists (
    select 1 from public.assessments a
    where a.id = eye_metrics.assessment_id and public.can_access_patient(a.patient_id)
  ));

drop policy if exists eye_metrics_insert on public.eye_metrics;
create policy eye_metrics_insert on public.eye_metrics
  for insert to authenticated
  with check (exists (
    select 1 from public.assessments a
    where a.id = eye_metrics.assessment_id and a.patient_id = auth.uid()
  ));

drop policy if exists voice_metrics_select on public.voice_metrics;
create policy voice_metrics_select on public.voice_metrics
  for select to authenticated
  using (exists (
    select 1 from public.assessments a
    where a.id = voice_metrics.assessment_id and public.can_access_patient(a.patient_id)
  ));

drop policy if exists voice_metrics_insert on public.voice_metrics;
create policy voice_metrics_insert on public.voice_metrics
  for insert to authenticated
  with check (exists (
    select 1 from public.assessments a
    where a.id = voice_metrics.assessment_id and a.patient_id = auth.uid()
  ));

drop policy if exists face_metrics_select on public.face_metrics;
create policy face_metrics_select on public.face_metrics
  for select to authenticated
  using (exists (
    select 1 from public.assessments a
    where a.id = face_metrics.assessment_id and public.can_access_patient(a.patient_id)
  ));

drop policy if exists face_metrics_insert on public.face_metrics;
create policy face_metrics_insert on public.face_metrics
  for insert to authenticated
  with check (exists (
    select 1 from public.assessments a
    where a.id = face_metrics.assessment_id and a.patient_id = auth.uid()
  ));

drop policy if exists baselines_select on public.baselines;
create policy baselines_select on public.baselines
  for select to authenticated
  using (public.can_access_patient(patient_id));

drop policy if exists baselines_clinician_write on public.baselines;
create policy baselines_clinician_write on public.baselines
  for all to authenticated
  using (public.can_access_patient(patient_id) and public.is_clinician())
  with check (public.can_access_patient(patient_id) and public.is_clinician());

drop policy if exists change_detections_select on public.change_detections;
create policy change_detections_select on public.change_detections
  for select to authenticated
  using (public.can_access_patient(patient_id));

drop policy if exists change_detections_clinician_write on public.change_detections;
create policy change_detections_clinician_write on public.change_detections
  for all to authenticated
  using (public.can_access_patient(patient_id) and public.is_clinician())
  with check (public.can_access_patient(patient_id) and public.is_clinician());

drop policy if exists reports_select on public.reports;
create policy reports_select on public.reports
  for select to authenticated
  using (public.can_access_patient(patient_id));

drop policy if exists reports_clinician_write on public.reports;
create policy reports_clinician_write on public.reports
  for all to authenticated
  using (public.can_access_patient(patient_id) and public.is_clinician())
  with check (public.can_access_patient(patient_id) and public.is_clinician());

drop policy if exists documents_select on public.documents;
create policy documents_select on public.documents
  for select to authenticated
  using (public.can_access_patient(patient_id));

drop policy if exists documents_clinician_write on public.documents;
create policy documents_clinician_write on public.documents
  for all to authenticated
  using (public.can_access_patient(patient_id) and public.is_clinician())
  with check (public.can_access_patient(patient_id) and public.is_clinician());

drop policy if exists notifications_select_own on public.notifications;
create policy notifications_select_own on public.notifications
  for select to authenticated
  using (recipient_id = auth.uid());

drop policy if exists notifications_update_own on public.notifications;
create policy notifications_update_own on public.notifications
  for update to authenticated
  using (recipient_id = auth.uid())
  with check (recipient_id = auth.uid());

drop policy if exists notifications_clinician_insert on public.notifications;
create policy notifications_clinician_insert on public.notifications
  for insert to authenticated
  with check (recipient_id = auth.uid() or public.is_clinician());

drop policy if exists consent_records_select on public.consent_records;
create policy consent_records_select on public.consent_records
  for select to authenticated
  using (public.can_access_patient(patient_id));

drop policy if exists consent_records_patient_write on public.consent_records;
create policy consent_records_patient_write on public.consent_records
  for insert to authenticated
  with check (patient_id = auth.uid() or public.is_clinician());

-- ----------------------------------------------------------- storage ------
-- Private buckets. Objects are read through short-lived signed URLs created by
-- the client (allowed: it has an authenticated session) or by FastAPI.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('clinical-documents', 'clinical-documents', false, 26214400,
   array['application/pdf', 'image/png', 'image/jpeg', 'text/plain']),
  ('assessment-reports', 'assessment-reports', false, 26214400,
   array['application/pdf', 'text/plain'])
on conflict (id) do nothing;

drop policy if exists "clinical documents read" on storage.objects;
create policy "clinical documents read" on storage.objects
  for select to authenticated
  using (
    bucket_id in ('clinical-documents', 'assessment-reports')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "clinical documents write own folder" on storage.objects;
create policy "clinical documents write own folder" on storage.objects
  for insert to authenticated
  with check (
    bucket_id in ('clinical-documents', 'assessment-reports')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Clinicians read files for patients they are allowed to see. Object paths are
-- '<patient_uuid>/<filename>' so the folder is the patient id.
drop policy if exists "clinicians read patient documents" on storage.objects;
create policy "clinicians read patient documents" on storage.objects
  for select to authenticated
  using (
    bucket_id in ('clinical-documents', 'assessment-reports')
    and public.is_clinician()
    and public.try_uuid((storage.foldername(name))[1]) is not null
    and public.can_access_patient(public.try_uuid((storage.foldername(name))[1]))
  );

-- ---------------------------------------------------------- realtime ------
-- Notifications are the only table streamed to the browser by default.

do $$ begin
  execute 'alter publication supabase_realtime add table public.notifications';
exception
  when undefined_object then null;
  when duplicate_object then null;
end $$;

alter table public.notifications replica identity full;
