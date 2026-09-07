-- Helen AI: student activity tracking
-- Tracks XP, streaks, and last activity date for the dashboard ring.

create table if not exists public.student_activity (
  student_id uuid primary key references auth.users(id) on delete cascade,
  xp_total integer not null default 0,
  current_streak integer not null default 0,
  last_active_date date not null default current_date
);

alter table public.student_activity enable row level security;

create policy "student_activity_select_own"
  on public.student_activity
  for select
  using (auth.uid() = student_id);

create policy "student_activity_insert_own"
  on public.student_activity
  for insert
  with check (auth.uid() = student_id);

create policy "student_activity_update_own"
  on public.student_activity
  for update
  using (auth.uid() = student_id)
  with check (auth.uid() = student_id);

-- Seed row with XP=0 / streak=0 whenever a student profile row is created.
create or replace function public.seed_student_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.student_activity (student_id, xp_total, current_streak, last_active_date)
  values (new.id, 0, 0, current_date)
  on conflict (student_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_student_profile_created on public.student_profiles;
create trigger on_student_profile_created
  after insert on public.student_profiles
  for each row execute function public.seed_student_activity();
