-- Access Control: global + per-project roles, permission bundles, and custom grants

-- Core catalog tables
create table if not exists public.access_permissions (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  description text,
  scope text not null check (scope in ('global','project')),
  module text,
  created_at timestamptz default now()
);

create table if not exists public.access_roles (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  description text,
  scope text not null check (scope in ('global','project')),
  is_system boolean default false,
  created_at timestamptz default now()
);

create table if not exists public.access_bundles (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  description text,
  scope text not null check (scope in ('global','project')),
  is_system boolean default false,
  created_at timestamptz default now()
);

create table if not exists public.access_role_permissions (
  role_id uuid references public.access_roles(id) on delete cascade,
  permission_id uuid references public.access_permissions(id) on delete cascade,
  primary key (role_id, permission_id)
);

create table if not exists public.access_bundle_permissions (
  bundle_id uuid references public.access_bundles(id) on delete cascade,
  permission_id uuid references public.access_permissions(id) on delete cascade,
  primary key (bundle_id, permission_id)
);

create table if not exists public.access_role_bundles (
  role_id uuid references public.access_roles(id) on delete cascade,
  bundle_id uuid references public.access_bundles(id) on delete cascade,
  primary key (role_id, bundle_id)
);

-- User assignments (global and per-project via project_id)
create table if not exists public.access_user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  role_id uuid references public.access_roles(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  created_at timestamptz default now()
);
create unique index if not exists access_user_roles_unique
  on public.access_user_roles (user_id, role_id, project_id);
-- Ensure project_id can be null for global assignments
alter table public.access_user_roles
  alter column project_id drop not null;

create table if not exists public.access_user_permissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  permission_id uuid references public.access_permissions(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  created_at timestamptz default now()
);
create unique index if not exists access_user_permissions_unique
  on public.access_user_permissions (user_id, permission_id, project_id);
-- Ensure project_id can be null for global assignments
alter table public.access_user_permissions
  alter column project_id drop not null;

create table if not exists public.access_audit (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  target_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  meta jsonb default '{}',
  created_at timestamptz default now()
);

-- Helper: is_admin
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.is_admin = true
  );
$$;

-- Effective permissions (global + project)
create or replace function public.access_effective_permissions(project_id uuid default null)
returns table(permission_key text)
language sql
security definer
set search_path = public
as $$
  with
  direct as (
    select p.key
    from public.access_user_permissions up
    join public.access_permissions p on p.id = up.permission_id
    where up.user_id = auth.uid()
      and (up.project_id is null or up.project_id = project_id)
  ),
  role_perms as (
    select p.key
    from public.access_user_roles ur
    join public.access_roles r on r.id = ur.role_id
    join public.access_role_permissions rp on rp.role_id = r.id
    join public.access_permissions p on p.id = rp.permission_id
    where ur.user_id = auth.uid()
      and (ur.project_id is null or ur.project_id = project_id)
  ),
  bundle_perms as (
    select p.key
    from public.access_user_roles ur
    join public.access_roles r on r.id = ur.role_id
    join public.access_role_bundles rb on rb.role_id = r.id
    join public.access_bundle_permissions bp on bp.bundle_id = rb.bundle_id
    join public.access_permissions p on p.id = bp.permission_id
    where ur.user_id = auth.uid()
      and (ur.project_id is null or ur.project_id = project_id)
  )
  select p.key
  from public.access_permissions p
  where public.is_admin()
  union
  select distinct key from (
    select key from direct
    union all select key from role_perms
    union all select key from bundle_perms
  ) as all_keys;
$$;

-- Convenience check
create or replace function public.has_permission(permission_key text, project_id uuid default null)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.access_effective_permissions(project_id) ep
    where ep.permission_key = permission_key
  );
$$;

-- RLS for access tables (admins only)
alter table public.access_permissions enable row level security;
alter table public.access_roles enable row level security;
alter table public.access_bundles enable row level security;
alter table public.access_role_permissions enable row level security;
alter table public.access_bundle_permissions enable row level security;
alter table public.access_role_bundles enable row level security;
alter table public.access_user_roles enable row level security;
alter table public.access_user_permissions enable row level security;
alter table public.access_audit enable row level security;

do $$
begin
  perform 1;
end $$;

drop policy if exists "Admins manage access_permissions" on public.access_permissions;
create policy "Admins manage access_permissions" on public.access_permissions
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins manage access_roles" on public.access_roles;
create policy "Admins manage access_roles" on public.access_roles
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins manage access_bundles" on public.access_bundles;
create policy "Admins manage access_bundles" on public.access_bundles
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins manage access_role_permissions" on public.access_role_permissions;
create policy "Admins manage access_role_permissions" on public.access_role_permissions
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins manage access_bundle_permissions" on public.access_bundle_permissions;
create policy "Admins manage access_bundle_permissions" on public.access_bundle_permissions
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins manage access_role_bundles" on public.access_role_bundles;
create policy "Admins manage access_role_bundles" on public.access_role_bundles
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins manage access_user_roles" on public.access_user_roles;
create policy "Admins manage access_user_roles" on public.access_user_roles
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins manage access_user_permissions" on public.access_user_permissions;
create policy "Admins manage access_user_permissions" on public.access_user_permissions
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins manage access_audit" on public.access_audit;
create policy "Admins manage access_audit" on public.access_audit
for all using (public.is_admin()) with check (public.is_admin());

-- Seed permissions (idempotent)
insert into public.access_permissions (key, description, scope, module)
values
  ('dashboard.view','View dashboard','global','dashboard'),
  ('profile.manage','Manage own profile','global','profile'),
  ('projects.view','View projects list','global','projects'),
  ('projects.manage','Create/update projects','global','projects'),
  ('projects.settings','Manage project settings','global','projects'),
  ('hours.view','View hours','global','hours'),
  ('learnings.manage','Manage learnings','global','learnings'),
  ('financial.view','View financials','global','financial'),
  ('global_tasks.manage','Manage global tasks','global','global_tasks'),
  ('documents.manage','Manage documents','global','documents'),
  ('calendar.view','View calendar','global','calendar'),
  ('quotations.manage','Manage quotations','global','quotations'),
  ('admin.access','Access admin area','global','admin'),
  ('admin.manage_access','Manage roles and permissions','global','admin'),
  ('project.view','View project','project','project'),
  ('project.manage','Manage project','project','project'),
  ('project.tasks.manage','Manage project tasks','project','tasks'),
  ('project.files.manage','Manage project files','project','files'),
  ('project.meetings.manage','Manage meetings','project','meetings'),
  ('project.members.manage','Manage members','project','members'),
  ('project.finance.manage','Manage project finance','project','finance')
on conflict (key) do nothing;

-- Seed role templates (idempotent)
insert into public.access_roles (name, description, scope, is_system)
values
  ('Owner','Full access','global',true),
  ('Admin','Administrative access','global',true),
  ('Manager','Operational access','global',true),
  ('Member','Standard member access','global',true),
  ('Viewer','Read-only access','global',true),
  ('Project Owner','Full project access','project',true),
  ('Project Admin','Admin project access','project',true),
  ('Project Member','Standard project access','project',true),
  ('Project Viewer','Read-only project access','project',true)
on conflict (name) do nothing;

-- Seed bundle templates (idempotent)
insert into public.access_bundles (name, description, scope, is_system)
values
  ('Finance Admin','Financial management bundle','global',true),
  ('Docs Admin','Documents management bundle','global',true),
  ('Project Ops','Project operations bundle','project',true)
on conflict (name) do nothing;

-- Seed role -> permission mappings (idempotent)
with
perm as (select id, key, scope from public.access_permissions),
role as (select id, name from public.access_roles)
insert into public.access_role_permissions (role_id, permission_id)
select r.id, p.id
from role r
join perm p on (
  -- Global roles
  (r.name = 'Owner' and p.scope = 'global') or
  (r.name = 'Admin' and p.key in (
    'dashboard.view','profile.manage','projects.view','projects.manage','projects.settings',
    'hours.view','learnings.manage','financial.view','global_tasks.manage','documents.manage',
    'calendar.view','quotations.manage','admin.access','admin.manage_access'
  )) or
  (r.name = 'Manager' and p.key in (
    'dashboard.view','projects.view','projects.manage','projects.settings','hours.view',
    'learnings.manage','global_tasks.manage','documents.manage','calendar.view','quotations.manage'
  )) or
  (r.name = 'Member' and p.key in (
    'dashboard.view','projects.view','hours.view','learnings.manage','global_tasks.manage',
    'documents.manage','calendar.view'
  )) or
  (r.name = 'Viewer' and p.key in (
    'dashboard.view','projects.view','calendar.view'
  )) or
  -- Project roles
  (r.name = 'Project Owner' and p.scope = 'project') or
  (r.name = 'Project Admin' and p.key in (
    'project.view','project.manage','project.tasks.manage','project.files.manage',
    'project.meetings.manage','project.members.manage','project.finance.manage'
  )) or
  (r.name = 'Project Member' and p.key in (
    'project.view','project.tasks.manage','project.files.manage','project.meetings.manage'
  )) or
  (r.name = 'Project Viewer' and p.key in (
    'project.view'
  ))
)
on conflict do nothing;

-- Seed bundle -> permission mappings (idempotent)
with
perm as (select id, key from public.access_permissions),
bundle as (select id, name from public.access_bundles)
insert into public.access_bundle_permissions (bundle_id, permission_id)
select b.id, p.id
from bundle b
join perm p on (
  (b.name = 'Finance Admin' and p.key in ('financial.view','project.finance.manage')) or
  (b.name = 'Docs Admin' and p.key in ('documents.manage')) or
  (b.name = 'Project Ops' and p.key in (
    'project.view','project.tasks.manage','project.files.manage','project.meetings.manage'
  ))
)
on conflict do nothing;
