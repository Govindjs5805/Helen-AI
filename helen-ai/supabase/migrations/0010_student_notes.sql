create table if not exists public.student_notes (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'My notes',
  content text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists student_notes_owner_updated_idx
  on public.student_notes (student_id, updated_at desc);

alter table public.student_notes enable row level security;

drop policy if exists "student_notes_select_own" on public.student_notes;
create policy "student_notes_select_own"
  on public.student_notes for select
  using (auth.uid() = student_id);

drop policy if exists "student_notes_insert_own" on public.student_notes;
create policy "student_notes_insert_own"
  on public.student_notes for insert
  with check (auth.uid() = student_id);

drop policy if exists "student_notes_update_own" on public.student_notes;
create policy "student_notes_update_own"
  on public.student_notes for update
  using (auth.uid() = student_id)
  with check (auth.uid() = student_id);

drop policy if exists "student_notes_delete_own" on public.student_notes;
create policy "student_notes_delete_own"
  on public.student_notes for delete
  using (auth.uid() = student_id);
