alter table public.student_profiles
  add column if not exists attention_preferences jsonb not null default '{
    "presentation": "not_sure",
    "focus_session_minutes": 15,
    "break_minutes": 5,
    "distraction_level": "medium",
    "chunk_size": "one_paragraph",
    "reminders": {"enabled": false, "style": "gentle"},
    "gamification": "off",
    "motion": "reduced",
    "sound_cues": false,
    "daily_goal": 3,
    "quiet_ui": true,
    "tldr_first": true,
    "accountability_prompts": false,
    "weekly_goal": 15
  }'::jsonb,
  add column if not exists attention_sharing_consent boolean not null default false;

create table if not exists public.focus_sessions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references auth.users(id) on delete cascade,
  task_label text not null default '',
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  planned_minutes integer not null default 15 check (planned_minutes between 5 and 45),
  focus_minutes integer not null default 0 check (focus_minutes >= 0),
  break_minutes integer not null default 0 check (break_minutes >= 0),
  interruptions integer not null default 0 check (interruptions >= 0),
  stuck_events integer not null default 0 check (stuck_events >= 0),
  status text not null default 'active' check (status in ('active', 'paused', 'completed', 'stopped')),
  created_at timestamptz not null default now()
);
create index if not exists focus_sessions_owner_started_idx
  on public.focus_sessions (student_id, started_at desc);

create table if not exists public.learning_tasks (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  source_text text not null default '',
  steps jsonb not null default '[]'::jsonb,
  estimated_minutes integer not null default 10 check (estimated_minutes > 0),
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'done')),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists learning_tasks_owner_updated_idx
  on public.learning_tasks (student_id, updated_at desc);

create table if not exists public.parked_thoughts (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists parked_thoughts_owner_created_idx
  on public.parked_thoughts (student_id, created_at desc);

create table if not exists public.planner_items (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  estimated_minutes integer not null default 15 check (estimated_minutes between 1 and 480),
  priority integer not null default 3 check (priority between 1 and 3),
  position integer not null default 0,
  due_date date not null default current_date,
  status text not null default 'todo' check (status in ('todo', 'done')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists planner_items_owner_date_idx
  on public.planner_items (student_id, due_date, position);

do $$
declare
  table_name text;
begin
  foreach table_name in array array['focus_sessions', 'learning_tasks', 'parked_thoughts', 'planner_items']
  loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_select_own', table_name);
    execute format('create policy %I on public.%I for select using (auth.uid() = student_id)', table_name || '_select_own', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_insert_own', table_name);
    execute format('create policy %I on public.%I for insert with check (auth.uid() = student_id)', table_name || '_insert_own', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_update_own', table_name);
    execute format('create policy %I on public.%I for update using (auth.uid() = student_id) with check (auth.uid() = student_id)', table_name || '_update_own', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_delete_own', table_name);
    execute format('create policy %I on public.%I for delete using (auth.uid() = student_id)', table_name || '_delete_own', table_name);
  end loop;
end
$$;
