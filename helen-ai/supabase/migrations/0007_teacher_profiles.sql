create table if not exists public.teacher_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  institute_name text not null,
  place text not null,
  designation text,
  subjects_taught text[] not null default '{}',
  created_at timestamptz not null default now(),
  constraint teacher_profiles_institute_name_not_blank check (length(trim(institute_name)) > 0),
  constraint teacher_profiles_place_not_blank check (length(trim(place)) > 0)
);

alter table public.teacher_profiles enable row level security;

drop policy if exists "teacher_profiles_select_own" on public.teacher_profiles;
create policy "teacher_profiles_select_own"
  on public.teacher_profiles
  for select
  using (auth.uid() = id);

drop policy if exists "teacher_profiles_insert_own" on public.teacher_profiles;
create policy "teacher_profiles_insert_own"
  on public.teacher_profiles
  for insert
  with check (
    auth.uid() = id
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'teacher'
    )
  );

drop policy if exists "teacher_profiles_update_own" on public.teacher_profiles;
create policy "teacher_profiles_update_own"
  on public.teacher_profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_role public.user_role;
  teacher_institute text;
  teacher_place text;
begin
  new_role := coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'student');
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new_role
  )
  on conflict (id) do nothing;

  if new_role = 'teacher' then
    teacher_institute := nullif(trim(new.raw_user_meta_data->>'institute_name'), '');
    teacher_place := nullif(trim(new.raw_user_meta_data->>'place'), '');
    if teacher_institute is null or teacher_place is null then
      raise exception 'Teacher registration requires an institute name and place';
    end if;

    insert into public.teacher_profiles (id, institute_name, place, designation)
    values (
      new.id,
      teacher_institute,
      teacher_place,
      nullif(trim(new.raw_user_meta_data->>'designation'), '')
    )
    on conflict (id) do nothing;
  end if;

  return new;
end;
$$;
