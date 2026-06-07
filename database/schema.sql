-- ============================================================
-- shared-space :: Database Schema
-- Postgres / Supabase
-- ============================================================
-- Conventions:
--   * UUID primary keys (gen_random_uuid())
--   * Soft delete via deleted_at on notes & expenses
--   * Row Level Security on every table
--   * Membership checks use SECURITY DEFINER helper to avoid
--     infinite recursion on workspace_members policies
-- ============================================================

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- profiles  (mirrors auth.users)
-- ------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text,
  avatar_url  text,
  created_at  timestamptz not null default now()
);

-- ------------------------------------------------------------
-- workspaces
-- ------------------------------------------------------------
create table if not exists public.workspaces (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  join_code   text unique,
  owner_id    uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now()
);

-- ------------------------------------------------------------
-- workspace_members
-- ------------------------------------------------------------
create table if not exists public.workspace_members (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces(id) on delete cascade,
  user_id       uuid not null references public.profiles(id) on delete cascade,
  role          text not null default 'member' check (role in ('owner','member')),
  created_at    timestamptz not null default now(),
  unique (workspace_id, user_id)
);

-- ------------------------------------------------------------
-- workspace_invites
-- ------------------------------------------------------------
create table if not exists public.workspace_invites (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces(id) on delete cascade,
  email         text not null,
  token         text not null unique default encode(gen_random_bytes(16), 'hex'),
  status        text not null default 'pending' check (status in ('pending','accepted','expired')),
  expires_at    timestamptz not null default (now() + interval '7 days'),
  created_by    uuid not null references public.profiles(id) on delete cascade,
  created_at    timestamptz not null default now()
);

-- ------------------------------------------------------------
-- notes  (polymorphic: note | todo | reminder)
-- ------------------------------------------------------------
create table if not exists public.notes (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces(id) on delete cascade,
  type          text not null default 'note' check (type in ('note','todo','reminder')),
  title         text,
  content       text,
  color         text not null default 'yellow'
                  check (color in ('yellow','pink','blue','green','purple','gray')),
  metadata      jsonb not null default '{}'::jsonb,
  created_by    uuid not null references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);

-- ------------------------------------------------------------
-- expense_categories  (workspace_id null = global default)
-- ------------------------------------------------------------
create table if not exists public.expense_categories (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid references public.workspaces(id) on delete cascade,
  name          text not null,
  icon          text
);

-- ------------------------------------------------------------
-- expenses
-- ------------------------------------------------------------
create table if not exists public.expenses (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces(id) on delete cascade,
  amount        numeric(12,2) not null check (amount >= 0),
  category      text,
  description   text,
  expense_date  date not null default current_date,
  created_by    uuid not null references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now(),
  deleted_at    timestamptz
);

-- ------------------------------------------------------------
-- notifications
-- ------------------------------------------------------------
create table if not exists public.notifications (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces(id) on delete cascade,
  user_id       uuid not null references public.profiles(id) on delete cascade,
  title         text not null,
  message       text,
  read          boolean not null default false,
  created_at    timestamptz not null default now()
);

-- ------------------------------------------------------------
-- activity_logs
-- ------------------------------------------------------------
create table if not exists public.activity_logs (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces(id) on delete cascade,
  user_id       uuid references public.profiles(id) on delete set null,
  action        text not null,
  entity_type   text,
  entity_id     uuid,
  metadata      jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now()
);

-- ============================================================
-- Membership helper (SECURITY DEFINER) -> avoids RLS recursion
-- ============================================================
create or replace function public.is_workspace_member(p_workspace_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.workspace_members m
    where m.workspace_id = p_workspace_id
      and m.user_id = auth.uid()
  );
$$;

-- ============================================================
-- updated_at trigger for notes
-- ============================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_notes_updated_at on public.notes;
create trigger trg_notes_updated_at
  before update on public.notes
  for each row execute function public.set_updated_at();

-- ============================================================
-- Indexes
-- ============================================================
create index if not exists idx_members_workspace on public.workspace_members(workspace_id);
create index if not exists idx_members_user      on public.workspace_members(user_id);
create index if not exists idx_notes_workspace    on public.notes(workspace_id) where deleted_at is null;
create index if not exists idx_expenses_workspace on public.expenses(workspace_id) where deleted_at is null;
create index if not exists idx_activity_workspace on public.activity_logs(workspace_id);

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.profiles            enable row level security;
alter table public.workspaces          enable row level security;
alter table public.workspace_members   enable row level security;
alter table public.workspace_invites   enable row level security;
alter table public.notes               enable row level security;
alter table public.expense_categories  enable row level security;
alter table public.expenses            enable row level security;
alter table public.notifications       enable row level security;
alter table public.activity_logs       enable row level security;

-- profiles: a user can read all profiles in shared workspaces, edit only own
create policy "profiles_select_self" on public.profiles
  for select using (true);
create policy "profiles_update_self" on public.profiles
  for update using (id = auth.uid());

-- workspaces: members can read; owner can update/delete
create policy "workspaces_select_member" on public.workspaces
  for select using (is_workspace_member(id) or owner_id = auth.uid());
create policy "workspaces_insert_owner" on public.workspaces
  for insert with check (owner_id = auth.uid());
create policy "workspaces_update_owner" on public.workspaces
  for update using (owner_id = auth.uid());
create policy "workspaces_delete_owner" on public.workspaces
  for delete using (owner_id = auth.uid());

-- workspace_members: members can read membership of their workspaces
create policy "members_select" on public.workspace_members
  for select using (is_workspace_member(workspace_id));
create policy "members_insert_owner" on public.workspace_members
  for insert with check (
    exists (select 1 from public.workspaces w
            where w.id = workspace_id and w.owner_id = auth.uid())
    or user_id = auth.uid()
  );
create policy "members_delete_owner" on public.workspace_members
  for delete using (
    exists (select 1 from public.workspaces w
            where w.id = workspace_id and w.owner_id = auth.uid())
  );

-- invites: workspace members manage invites
create policy "invites_all_member" on public.workspace_invites
  for all using (is_workspace_member(workspace_id))
  with check (is_workspace_member(workspace_id));

-- notes / expenses / notifications / activity: workspace members
create policy "notes_all_member" on public.notes
  for all using (is_workspace_member(workspace_id))
  with check (is_workspace_member(workspace_id));
create policy "expenses_all_member" on public.expenses
  for all using (is_workspace_member(workspace_id))
  with check (is_workspace_member(workspace_id));
create policy "notifications_select_self" on public.notifications
  for select using (user_id = auth.uid());
create policy "notifications_update_self" on public.notifications
  for update using (user_id = auth.uid());
create policy "activity_select_member" on public.activity_logs
  for select using (is_workspace_member(workspace_id));
create policy "activity_insert_member" on public.activity_logs
  for insert with check (is_workspace_member(workspace_id));

-- expense_categories: global defaults readable by all; workspace ones by members
create policy "categories_select" on public.expense_categories
  for select using (workspace_id is null or is_workspace_member(workspace_id));
create policy "categories_insert_member" on public.expense_categories
  for insert with check (workspace_id is not null and is_workspace_member(workspace_id));

-- ============================================================
-- Seed: global default expense categories
-- ============================================================
insert into public.expense_categories (workspace_id, name, icon) values
  (null, 'Food',      'utensils'),
  (null, 'Travel',    'plane'),
  (null, 'Shopping',  'shopping-bag'),
  (null, 'Bills',     'receipt'),
  (null, 'Health',    'heart-pulse'),
  (null, 'Education', 'graduation-cap'),
  (null, 'Other',     'circle-dashed')
on conflict do nothing;
