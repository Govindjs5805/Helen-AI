-- Student IDs use a transactional yearly counter instead of nextval(): PostgreSQL
-- sequences are concurrency-safe but are not gapless when a transaction rolls back.

alter table public.profiles
  add column if not exists student_id text;

create table if not exists public.student_id_counters (
  year integer primary key,
  last_value integer not null
);

alter table public.student_id_counters enable row level security;
revoke all on public.student_id_counters from public, anon, authenticated;

create or replace function public.next_student_id()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  current_year integer := extract(year from current_date)::integer;
  next_value integer;
begin
  insert into public.student_id_counters as counters (year, last_value)
  values (current_year, 1)
  on conflict (year) do update
    set last_value = counters.last_value + 1
  returning last_value into next_value;

  return format('HAI-%s-%s', current_year, lpad(next_value::text, 4, '0'));
end;
$$;

-- Backfill existing students so every student can share an ID immediately.
do $$
declare
  student_row record;
begin
  for student_row in
    select id
    from public.profiles
    where role = 'student' and student_id is null
    order by created_at, id
  loop
    update public.profiles
    set student_id = public.next_student_id()
    where id = student_row.id;
  end loop;
end;
$$;

create unique index if not exists profiles_student_id_key
  on public.profiles (student_id);

alter table public.profiles
  drop constraint if exists profiles_student_id_role_check;
alter table public.profiles
  add constraint profiles_student_id_role_check
  check (
    (role = 'student' and student_id is not null)
    or (role <> 'student' and student_id is null)
  );

create or replace function public.assign_student_id()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role = 'student' then
    new.student_id := public.next_student_id();
  else
    new.student_id := null;
  end if;
  return new;
end;
$$;

drop trigger if exists assign_student_id_on_profile_insert on public.profiles;
create trigger assign_student_id_on_profile_insert
  before insert on public.profiles
  for each row execute function public.assign_student_id();

create or replace function public.keep_student_id_system_managed()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.student_id is distinct from old.student_id then
    raise exception 'student_id is system managed';
  end if;
  return new;
end;
$$;

drop trigger if exists keep_student_id_system_managed on public.profiles;
create trigger keep_student_id_system_managed
  before update of student_id on public.profiles
  for each row execute function public.keep_student_id_system_managed();

create or replace function public.keep_profile_role_system_managed()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if auth.uid() is not null and new.role is distinct from old.role then
    raise exception 'profile role is system managed';
  end if;
  return new;
end;
$$;

drop trigger if exists keep_profile_role_system_managed on public.profiles;
create trigger keep_profile_role_system_managed
  before update of role on public.profiles
  for each row execute function public.keep_profile_role_system_managed();

-- Recreate the auth mirror trigger so ID allocation happens only for students.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_role public.user_role;
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
  return new;
end;
$$;

create table if not exists public.classrooms (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  subject text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.classroom_students (
  id uuid primary key default gen_random_uuid(),
  classroom_id uuid not null references public.classrooms(id) on delete cascade,
  student_id text not null references public.profiles(student_id) on delete cascade,
  joined_at timestamptz not null default now(),
  constraint classroom_students_classroom_student_key unique (classroom_id, student_id)
);

create index if not exists classrooms_teacher_idx
  on public.classrooms (teacher_id, created_at);
create index if not exists classroom_students_classroom_idx
  on public.classroom_students (classroom_id, joined_at);
create index if not exists classroom_students_student_idx
  on public.classroom_students (student_id);

alter table public.classrooms enable row level security;
alter table public.classroom_students enable row level security;

create policy "teachers_manage_own_classrooms"
  on public.classrooms
  for all
  using (
    auth.uid() = teacher_id
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'teacher'
    )
  )
  with check (
    auth.uid() = teacher_id
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'teacher'
    )
  );

create policy "teachers_read_own_classroom_students"
  on public.classroom_students
  for select
  using (
    exists (
      select 1 from public.classrooms c
      where c.id = classroom_id and c.teacher_id = auth.uid()
    )
  );

create policy "teachers_add_students_to_own_classrooms"
  on public.classroom_students
  for insert
  with check (
    exists (
      select 1 from public.classrooms c
      where c.id = classroom_id and c.teacher_id = auth.uid()
    )
  );

create policy "teachers_remove_students_from_own_classrooms"
  on public.classroom_students
  for delete
  using (
    exists (
      select 1 from public.classrooms c
      where c.id = classroom_id and c.teacher_id = auth.uid()
    )
  );

create policy "students_read_own_classroom_memberships"
  on public.classroom_students
  for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role = 'student'
        and p.student_id = classroom_students.student_id
    )
  );

create or replace function public.lookup_student_by_id(p_student_id text)
returns table (id uuid, student_id text, full_name text)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'teacher'
  ) then
    raise exception 'teacher access required' using errcode = '42501';
  end if;

  return query
    select p.id, p.student_id, coalesce(p.full_name, '')
    from public.profiles p
    where p.student_id = p_student_id and p.role = 'student';
end;
$$;

grant execute on function public.lookup_student_by_id(text) to authenticated;

create or replace function public.get_classroom_roster(p_classroom_id uuid)
returns table (id uuid, student_id text, full_name text, joined_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.classrooms c
    where c.id = p_classroom_id and c.teacher_id = auth.uid()
  ) then
    raise exception 'classroom access required' using errcode = '42501';
  end if;

  return query
    select cs.id, p.student_id, coalesce(p.full_name, ''), cs.joined_at
    from public.classroom_students cs
    join public.profiles p on p.student_id = cs.student_id and p.role = 'student'
    where cs.classroom_id = p_classroom_id
    order by p.full_name, p.student_id;
end;
$$;

grant execute on function public.get_classroom_roster(uuid) to authenticated;

create or replace function public.get_rostered_student_progress(p_student_id text)
returns table (
  student_id text,
  full_name text,
  xp_total integer,
  current_streak integer,
  last_active_date date
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.classroom_students cs
    join public.classrooms c on c.id = cs.classroom_id
    where cs.student_id = p_student_id and c.teacher_id = auth.uid()
  ) then
    raise exception 'student is not on your roster' using errcode = '42501';
  end if;

  return query
    select p.student_id, coalesce(p.full_name, ''),
      coalesce(sa.xp_total, 0), coalesce(sa.current_streak, 0), sa.last_active_date
    from public.profiles p
    left join public.student_activity sa on sa.student_id = p.id
    where p.student_id = p_student_id and p.role = 'student';
end;
$$;

grant execute on function public.get_rostered_student_progress(text) to authenticated;

create or replace function public.is_teacher_rostered_student(p_auth_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    join public.classroom_students cs on cs.student_id = p.student_id
    join public.classrooms c on c.id = cs.classroom_id
    where p.id = p_auth_user_id and c.teacher_id = auth.uid()
  );
$$;

grant execute on function public.is_teacher_rostered_student(uuid) to authenticated;

revoke all on function public.next_student_id() from public, anon, authenticated;
revoke all on function public.assign_student_id() from public, anon, authenticated;
revoke all on function public.keep_student_id_system_managed() from public, anon, authenticated;
revoke all on function public.keep_profile_role_system_managed() from public, anon, authenticated;
revoke all on function public.lookup_student_by_id(text) from public, anon;
revoke all on function public.get_classroom_roster(uuid) from public, anon;
revoke all on function public.get_rostered_student_progress(text) from public, anon;
revoke all on function public.is_teacher_rostered_student(uuid) from public, anon;
grant execute on function public.lookup_student_by_id(text) to authenticated;
grant execute on function public.get_classroom_roster(uuid) to authenticated;
grant execute on function public.get_rostered_student_progress(text) to authenticated;
grant execute on function public.is_teacher_rostered_student(uuid) to authenticated;

create policy "teachers_read_rostered_student_activity"
  on public.student_activity
  for select
  using (public.is_teacher_rostered_student(student_id));
