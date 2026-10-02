do $$
begin
  if not exists (select 1 from pg_type where typname = 'document_source_type') then
    create type public.document_source_type as enum ('pdf', 'image', 'text');
  end if;
  if not exists (select 1 from pg_type where typname = 'document_status') then
    create type public.document_status as enum ('processing', 'done', 'failed');
  end if;
end
$$;

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  student_id text not null references public.profiles(student_id) on delete cascade,
  title text not null,
  original_text text not null default '',
  simplified_text text,
  source_type public.document_source_type not null,
  status public.document_status not null default 'processing',
  error_message text,
  created_at timestamptz not null default now()
);

create index if not exists documents_student_created_idx
  on public.documents (student_id, created_at desc);

alter table public.documents enable row level security;

create policy "students_read_own_documents"
  on public.documents
  for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role = 'student'
        and p.student_id = documents.student_id
    )
  );

create policy "students_insert_own_documents"
  on public.documents
  for insert
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role = 'student'
        and p.student_id = documents.student_id
    )
  );

create policy "students_update_own_documents"
  on public.documents
  for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role = 'student'
        and p.student_id = documents.student_id
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role = 'student'
        and p.student_id = documents.student_id
    )
  );

create policy "students_delete_own_documents"
  on public.documents
  for delete
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role = 'student'
        and p.student_id = documents.student_id
    )
  );