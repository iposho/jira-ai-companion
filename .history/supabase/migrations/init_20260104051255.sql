-- Jira AI Companion - Supabase Migration
-- ========================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ========================================
-- TABLES
-- ========================================

-- Reports metadata table
create table if not exists public.reports (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  type text not null check (type in ('planning', 'daily', 'weekly', 'time')),
  title text not null,
  storage_path text not null,
  project_key text not null default 'DEV',
  date_from date,
  date_to date,
  created_at timestamptz default now() not null,
  metadata jsonb default '{}'::jsonb
);

-- Index for faster queries
create index if not exists reports_user_id_idx on public.reports(user_id);
create index if not exists reports_type_idx on public.reports(type);
create index if not exists reports_created_at_idx on public.reports(created_at desc);

-- ========================================
-- ROW LEVEL SECURITY
-- ========================================

alter table public.reports enable row level security;

-- Users can only see their own reports
create policy "Users can view own reports"
  on public.reports for select
  using (auth.uid() = user_id);

-- Users can insert their own reports
create policy "Users can insert own reports"
  on public.reports for insert
  with check (auth.uid() = user_id);

-- Users can delete their own reports
create policy "Users can delete own reports"
  on public.reports for delete
  using (auth.uid() = user_id);

-- ========================================
-- STORAGE
-- ========================================

-- Create storage bucket for reports
insert into storage.buckets (id, name, public)
values ('reports', 'reports', false)
on conflict (id) do nothing;

-- Storage policies
create policy "Users can upload reports"
  on storage.objects for insert
  with check (
    bucket_id = 'reports' and
    auth.uid() is not null
  );

create policy "Users can read own reports"
  on storage.objects for select
  using (
    bucket_id = 'reports' and
    auth.uid() is not null
  );

create policy "Users can delete own reports"
  on storage.objects for delete
  using (
    bucket_id = 'reports' and
    auth.uid() is not null
  );

-- ========================================
-- FUNCTIONS
-- ========================================

-- Function to get report count by type
create or replace function get_report_stats(p_user_id uuid)
returns table (
  report_type text,
  count bigint
) language sql security definer as $$
  select type, count(*)
  from public.reports
  where user_id = p_user_id
  group by type;
$$;
