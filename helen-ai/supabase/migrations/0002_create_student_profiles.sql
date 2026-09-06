-- Helen AI: student onboarding
-- Two tables that capture accessibility + learning-profile data during the
-- post-registration wizard. This drives every other module (UI adaptation,
-- content simplification, pacing, etc.).

-- Enums -------------------------------------------------------------------

do $$
begin
  if not exists (select 1 from pg_type where typname = 'preferred_pace') then
    create type preferred_pace as enum ('slow', 'moderate', 'fast');
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'accessibility_need_type') then
    create type accessibility_need_type as enum (
      'visual_impairment',
      'hearing_impairment',
      'dyslexia',
      'adhd',
      'motor_impairment',
      'autism_spectrum',
      'other_learning_disability'
    );
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'need_priority') then
    create type need_priority as enum ('primary', 'secondary');
  end if;
end
$$;

-- student_profiles --------------------------------------------------------

create table if not exists public.student_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  age integer check (age is null or (age >= 5 and age <= 120)),
  grade text,
  subjects text[] not null default '{}',
  learning_goals text,
  preferred_pace preferred_pace not null default 'moderate',
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now()
);

-- One profile row per user, in case a future code path tries to insert twice.
create unique index if not exists student_profiles_pkey
  on public.student_profiles (id);

-- accessibility_needs -----------------------------------------------------

create table if not exists public.accessibility_needs (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references auth.users(id) on delete cascade,
  need_type accessibility_need_type not null,
  priority need_priority not null default 'secondary',
  created_at timestamptz not null default now()
);

-- Prevent the same need being added twice for the same student.
create unique index if not exists accessibility_needs_student_type_uniq
  on public.accessibility_needs (student_id, need_type);

-- Indexes for fast lookups (the dashboard will frequently read these).
create index if not exists accessibility_needs_student_idx
  on public.accessibility_needs (student_id);

create index if not exists accessibility_needs_primary_idx
  on public.accessibility_needs (student_id, priority);

-- Row-Level Security -----------------------------------------------------

alter table public.student_profiles enable row level security;
alter table public.accessibility_needs enable row level security;

-- student_profiles policies: a student can fully manage their own row only.

drop policy if exists "student_profiles_select_own" on public.student_profiles;
create policy "student_profiles_select_own"
  on public.student_profiles
  for select
  using (auth.uid() = id);

drop policy if exists "student_profiles_insert_own" on public.student_profiles;
create policy "student_profiles_insert_own"
  on public.student_profiles
  for insert
  with check (auth.uid() = id);

drop policy if exists "student_profiles_update_own" on public.student_profiles;
create policy "student_profiles_update_own"
  on public.student_profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "student_profiles_delete_own" on public.student_profiles;
create policy "student_profiles_delete_own"
  on public.student_profiles
  for delete
  using (auth.uid() = id);

-- accessibility_needs policies: scoped to the owning student.

drop policy if exists "accessibility_needs_select_own" on public.accessibility_needs;
create policy "accessibility_needs_select_own"
  on public.accessibility_needs
  for select
  using (auth.uid() = student_id);

drop policy if exists "accessibility_needs_insert_own" on public.accessibility_needs;
create policy "accessibility_needs_insert_own"
  on public.accessibility_needs
  for insert
  with check (auth.uid() = student_id);

drop policy if exists "accessibility_needs_update_own" on public.accessibility_needs;
create policy "accessibility_needs_update_own"
  on public.accessibility_needs
  for update
  using (auth.uid() = student_id)
  with check (auth.uid() = student_id);

drop policy if exists "accessibility_needs_delete_own" on public.accessibility_needs;
create policy "accessibility_needs_delete_own"
  on public.accessibility_needs
  for delete
  using (auth.uid() = student_id);
