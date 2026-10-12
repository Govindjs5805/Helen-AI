create table if not exists public.attention_share_invites (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references auth.users(id) on delete cascade,
  recipient_email text not null,
  token_hash text not null unique,
  share_focus_summary boolean not null default false,
  share_task_progress boolean not null default false,
  share_accommodations boolean not null default false,
  expires_at timestamptz not null,
  redeemed_by uuid references auth.users(id) on delete set null,
  redeemed_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  check (share_focus_summary or share_task_progress or share_accommodations)
);
create index if not exists attention_share_invites_owner_idx
  on public.attention_share_invites (student_id, created_at desc);

create table if not exists public.attention_shares (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references auth.users(id) on delete cascade,
  recipient_user_id uuid not null references auth.users(id) on delete cascade,
  recipient_role text not null check (recipient_role in ('parent', 'teacher')),
  share_focus_summary boolean not null default false,
  share_task_progress boolean not null default false,
  share_accommodations boolean not null default false,
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  unique (student_id, recipient_user_id),
  check (share_focus_summary or share_task_progress or share_accommodations)
);
create index if not exists attention_shares_recipient_idx
  on public.attention_shares (recipient_user_id, created_at desc)
  where revoked_at is null;

alter table public.attention_share_invites enable row level security;
alter table public.attention_shares enable row level security;

-- Writes go through the verified invite API; clients cannot forge or edit grants.
drop policy if exists attention_share_invites_student_select on public.attention_share_invites;
create policy attention_share_invites_student_select
  on public.attention_share_invites for select using (auth.uid() = student_id);

drop policy if exists attention_shares_student_select on public.attention_shares;
create policy attention_shares_student_select
  on public.attention_shares for select using (auth.uid() = student_id);
drop policy if exists attention_shares_recipient_select on public.attention_shares;
create policy attention_shares_recipient_select
  on public.attention_shares for select using (auth.uid() = recipient_user_id);
