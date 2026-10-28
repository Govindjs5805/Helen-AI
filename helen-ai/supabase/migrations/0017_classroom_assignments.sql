-- Classroom assignments posted by teachers.
create table if not exists public.classroom_assignments (
  id uuid primary key default gen_random_uuid(),
  classroom_id uuid not null references public.classrooms(id) on delete cascade,
  teacher_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 120),
  instructions text not null check (char_length(trim(instructions)) between 1 and 5000),
  due_date date,
  created_at timestamptz not null default now(),
  constraint classroom_assignments_classroom_id_key unique (id, classroom_id)
);

create index if not exists classroom_assignments_classroom_created_idx
  on public.classroom_assignments (classroom_id, created_at desc);

alter table public.classroom_assignments enable row level security;

create policy "teachers_manage_assignments_for_own_classes"
  on public.classroom_assignments
  for all
  using (
    auth.uid() = teacher_id
    and exists (
      select 1 from public.classrooms c
      where c.id = classroom_id and c.teacher_id = auth.uid()
    )
  )
  with check (
    auth.uid() = teacher_id
    and exists (
      select 1 from public.classrooms c
      where c.id = classroom_id and c.teacher_id = auth.uid()
    )
  );

create policy "students_read_assignments_for_their_classes"
  on public.classroom_assignments
  for select
  using (
    exists (
      select 1
      from public.classroom_students cs
      join public.profiles p on p.student_id = cs.student_id
      where cs.classroom_id = classroom_assignments.classroom_id
        and p.id = auth.uid()
        and p.role = 'student'
    )
  );
