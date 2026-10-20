alter table public.student_profiles
  add column if not exists theme_mode text not null default 'light'
    check (theme_mode in ('light', 'dark')),
  add column if not exists calm_mode boolean not null default false;
