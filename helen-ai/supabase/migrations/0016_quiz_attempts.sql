create table if not exists public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references auth.users(id) on delete cascade,
  subject text,
  topic text not null,
  score integer not null check (score >= 0),
  total_questions integer not null check (total_questions > 0 and score <= total_questions),
  completed_at timestamptz not null default now()
);

create index if not exists quiz_attempts_owner_completed_idx
  on public.quiz_attempts (student_id, completed_at desc);

alter table public.quiz_attempts enable row level security;

drop policy if exists quiz_attempts_select_own on public.quiz_attempts;
create policy quiz_attempts_select_own
  on public.quiz_attempts for select
  using (auth.uid() = student_id);

drop policy if exists quiz_attempts_insert_own on public.quiz_attempts;
create policy quiz_attempts_insert_own
  on public.quiz_attempts for insert
  with check (auth.uid() = student_id);
