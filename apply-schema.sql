-- Apply this script to your Supabase database via SQL Editor
-- This will create all the necessary tables and policies

-- Add email column to profiles if it doesn't exist
alter table public.profiles add column if not exists email text;

-- Weekly Hours table
create table if not exists public.weekly_hours (
	id uuid primary key default gen_random_uuid(),
	user_id uuid references auth.users(id) on delete cascade not null,
	week_start date not null, -- Monday of the week
	monday_hours integer not null default 0,
	tuesday_hours integer not null default 0,
	wednesday_hours integer not null default 0,
	thursday_hours integer not null default 0,
	friday_hours integer not null default 0,
	saturday_hours integer not null default 0,
	sunday_hours integer not null default 0,
	notes text,
	created_at timestamptz default now(),
	updated_at timestamptz default now(),
	unique (user_id, week_start)
);

-- Learning Resources table
create table if not exists public.learning_resources (
	id uuid primary key default gen_random_uuid(),
	user_id uuid references auth.users(id) on delete cascade not null,
	title text not null,
	description text,
	url text not null,
	category text not null default 'programming',
	difficulty text not null default 'beginner' check (difficulty in ('beginner', 'intermediate', 'advanced')),
	estimated_time integer not null default 30, -- in minutes
	tags text[] default '{}',
	rating integer default 0 check (rating >= 0 and rating <= 5),
	completed boolean default false,
	created_at timestamptz default now(),
	updated_at timestamptz default now()
);

-- Projects table
create table if not exists public.projects (
	id uuid primary key default gen_random_uuid(),
	name text not null,
	description text,
	status text not null default 'planning' check (status in ('planning', 'active', 'completed', 'on-hold')),
	owner_id uuid references auth.users(id) on delete cascade not null,
	client_name text,
	client_email text,
	client_company text,
	client_phone text,
	client_notes text,
	created_at timestamptz default now(),
	updated_at timestamptz default now()
);

-- Ensure client columns exist for existing deployments
alter table public.projects add column if not exists client_name text;
alter table public.projects add column if not exists client_email text;
alter table public.projects add column if not exists client_company text;
alter table public.projects add column if not exists client_phone text;
alter table public.projects add column if not exists client_notes text;

-- Project members table
create table if not exists public.project_members (
	id uuid primary key default gen_random_uuid(),
	project_id uuid references public.projects(id) on delete cascade not null,
	user_id uuid references auth.users(id) on delete cascade not null,
	role text not null default 'member' check (role in ('owner', 'admin', 'member')),
	joined_at timestamptz default now(),
	unique (project_id, user_id)
);

-- Project tasks table
create table if not exists public.project_tasks (
	id uuid primary key default gen_random_uuid(),
	project_id uuid references public.projects(id) on delete cascade not null,
	title text not null,
	description text,
	status text not null default 'todo' check (status in ('todo', 'in-progress', 'completed')),
	priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
	due_date date,
	assigned_to uuid references auth.users(id) on delete set null,
	created_at timestamptz default now(),
	updated_at timestamptz default now()
);

-- Project messages table
create table if not exists public.project_messages (
	id uuid primary key default gen_random_uuid(),
	project_id uuid references public.projects(id) on delete cascade not null,
	user_id uuid references auth.users(id) on delete cascade not null,
	content text not null,
	created_at timestamptz default now()
);

-- Project files table
create table if not exists public.project_files (
	id uuid primary key default gen_random_uuid(),
	project_id uuid references public.projects(id) on delete cascade not null,
	user_id uuid references auth.users(id) on delete cascade not null,
	filename text not null,
	file_path text not null,
	file_size bigint,
	file_type text,
	created_at timestamptz default now()
);

-- Triggers for new tables
create or replace trigger weekly_hours_set_updated_at
before update on public.weekly_hours
for each row execute function public.set_updated_at();

create or replace trigger learning_resources_set_updated_at
before update on public.learning_resources
for each row execute function public.set_updated_at();

create or replace trigger projects_set_updated_at
before update on public.projects
for each row execute function public.set_updated_at();

create or replace trigger project_tasks_set_updated_at
before update on public.project_tasks
for each row execute function public.set_updated_at();

-- Enable RLS for new tables
alter table public.weekly_hours enable row level security;
alter table public.learning_resources enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.project_tasks enable row level security;
alter table public.project_messages enable row level security;
alter table public.project_files enable row level security;

-- Clients table
create table if not exists public.clients (
    id uuid primary key default gen_random_uuid(),
    owner_id uuid references auth.users(id) on delete cascade not null,
    name text not null,
    email text,
    company text,
    phone text,
    notes text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create index if not exists clients_owner_idx on public.clients(owner_id);

create or replace trigger clients_set_updated_at
before update on public.clients
for each row execute function public.set_updated_at();

alter table public.clients enable row level security;

drop policy if exists "Users can view their clients" on public.clients;
create policy "Users can view their clients" on public.clients
    for select using (auth.uid() = owner_id);

drop policy if exists "Users can manage their clients" on public.clients;
create policy "Users can manage their clients" on public.clients
    for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- Link projects to clients
alter table public.projects add column if not exists client_id uuid references public.clients(id) on delete set null;

-- Weekly Hours policies
drop policy if exists "Users can view all weekly hours" on public.weekly_hours;
create policy "Users can view all weekly hours" on public.weekly_hours
	for select using (auth.role() = 'authenticated');

drop policy if exists "Users can create their own weekly hours" on public.weekly_hours;
create policy "Users can create their own weekly hours" on public.weekly_hours
	for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update their own weekly hours" on public.weekly_hours;
create policy "Users can update their own weekly hours" on public.weekly_hours
	for update using (auth.uid() = user_id);

drop policy if exists "Users can delete their own weekly hours" on public.weekly_hours;
create policy "Users can delete their own weekly hours" on public.weekly_hours
	for delete using (auth.uid() = user_id);

-- Learning Resources policies
drop policy if exists "Users can view their own learning resources" on public.learning_resources;
create policy "Users can view their own learning resources" on public.learning_resources
	for select using (auth.uid() = user_id);

drop policy if exists "Users can create their own learning resources" on public.learning_resources;
create policy "Users can create their own learning resources" on public.learning_resources
	for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update their own learning resources" on public.learning_resources;
create policy "Users can update their own learning resources" on public.learning_resources
	for update using (auth.uid() = user_id);

drop policy if exists "Users can delete their own learning resources" on public.learning_resources;
create policy "Users can delete their own learning resources" on public.learning_resources
	for delete using (auth.uid() = user_id);

-- Projects policies
drop policy if exists "Users can view projects they own or are members of" on public.projects;
create policy "Users can view projects they own or are members of" on public.projects
	for select using (
		auth.uid() = owner_id or 
		auth.uid() in (select user_id from public.project_members where project_id = id)
	);

drop policy if exists "Users can create projects" on public.projects;
create policy "Users can create projects" on public.projects
	for insert with check (auth.uid() = owner_id);

drop policy if exists "Project owners can update projects" on public.projects;
create policy "Project owners can update projects" on public.projects
	for update using (auth.uid() = owner_id);

drop policy if exists "Project owners can delete projects" on public.projects;
create policy "Project owners can delete projects" on public.projects
	for delete using (auth.uid() = owner_id);

-- Project members policies
DROP POLICY IF EXISTS "Users can view project members" ON public.project_members;
CREATE POLICY "Users can view project members" ON public.project_members
    FOR SELECT USING (
        auth.uid() = user_id OR 
        auth.uid() = (SELECT owner_id FROM public.projects WHERE id = project_members.project_id)
    );

-- Helper to check project access without triggering RLS recursion
create or replace function public.user_can_access_project(pid uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select (
    exists (select 1 from public.projects p where p.id = pid and p.owner_id = auth.uid())
    or exists (select 1 from public.project_members pm where pm.project_id = pid and pm.user_id = auth.uid())
  );
$$;

revoke all on function public.user_can_access_project(uuid) from public;

drop policy if exists "Users can view project members" on public.project_members;
create policy "Users can view project members" on public.project_members
    for select using (public.user_can_access_project(project_id));

drop policy if exists "Project owners can manage members" on public.project_members;
create policy "Project owners can manage members" on public.project_members
	for all using (
		auth.uid() in (select owner_id from public.projects where id = project_id)
	);

-- Project tasks policies
drop policy if exists "Users can view tasks in their projects" on public.project_tasks;
create policy "Users can view tasks in their projects" on public.project_tasks
	for select using (
		auth.uid() in (
			select user_id from public.project_members where project_id = project_tasks.project_id
			union
			select owner_id from public.projects where id = project_tasks.project_id
		)
	);

drop policy if exists "Project members can create tasks" on public.project_tasks;
create policy "Project members can create tasks" on public.project_tasks
	for insert with check (
		auth.uid() in (
			select user_id from public.project_members where project_id = project_tasks.project_id
			union
			select owner_id from public.projects where id = project_tasks.project_id
		)
	);

drop policy if exists "Project members can update tasks" on public.project_tasks;
create policy "Project members can update tasks" on public.project_tasks
	for update using (
		auth.uid() in (
			select user_id from public.project_members where project_id = project_tasks.project_id
			union
			select owner_id from public.projects where id = project_tasks.project_id
		)
	);

-- Project messages policies
drop policy if exists "Users can view messages in their projects" on public.project_messages;
create policy "Users can view messages in their projects" on public.project_messages
	for select using (
		auth.uid() in (
			select user_id from public.project_members where project_id = project_messages.project_id
			union
			select owner_id from public.projects where id = project_messages.project_id
		)
	);

drop policy if exists "Project members can send messages" on public.project_messages;
create policy "Project members can send messages" on public.project_messages
	for insert with check (
		auth.uid() in (
			select user_id from public.project_members where project_id = project_messages.project_id
			union
			select owner_id from public.projects where id = project_messages.project_id
		)
	);

-- Project files policies
drop policy if exists "Users can view files in their projects" on public.project_files;
create policy "Users can view files in their projects" on public.project_files
	for select using (
		auth.uid() in (
			select user_id from public.project_members where project_id = project_files.project_id
			union
			select owner_id from public.projects where id = project_files.project_id
		)
	);

drop policy if exists "Project members can upload files" on public.project_files;
create policy "Project members can upload files" on public.project_files
	for insert with check (
		auth.uid() in (
			select user_id from public.project_members where project_id = project_files.project_id
			union
			select owner_id from public.projects where id = project_files.project_id
		)
	);

-- Storage bucket for project files
insert into storage.buckets (id, name, public) values ('project-files', 'project-files', false)
on conflict (id) do nothing;

-- Storage policies for project files
drop policy if exists "Project members can upload files" on storage.objects;
create policy "Project members can upload files" on storage.objects
	for insert with check (
		bucket_id = 'project-files' and
		auth.uid() in (
			select user_id from public.project_members 
			where project_id::text = (storage.foldername(name))[2]
			union
			select owner_id from public.projects 
			where id::text = (storage.foldername(name))[2]
		)
	);

drop policy if exists "Project members can view files" on storage.objects;
create policy "Project members can view files" on storage.objects
	for select using (
		bucket_id = 'project-files' and
		auth.uid() in (
			select user_id from public.project_members 
			where project_id::text = (storage.foldername(name))[2]
			union
			select owner_id from public.projects 
			where id::text = (storage.foldername(name))[2]
		)
	);

drop policy if exists "Project members can delete files" on storage.objects;
create policy "Project members can delete files" on storage.objects
	for delete using (
		bucket_id = 'project-files' and
		auth.uid() in (
			select user_id from public.project_members 
			where project_id::text = (storage.foldername(name))[2]
			union
			select owner_id from public.projects 
			where id::text = (storage.foldername(name))[2]
		)
	);
