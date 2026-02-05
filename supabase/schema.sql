-- Profiles table
create table if not exists public.profiles (
	id uuid primary key references auth.users(id) on delete cascade,
	full_name text,
	avatar_url text,
	email text,
	career_focus text,
	skills text[] default '{}',
	experience text,
	current_status text,
	portfolio text,
	created_at timestamptz default now(),
	updated_at timestamptz default now()
);

-- Add email column if it doesn't exist (for existing profiles table)
alter table public.profiles add column if not exists email text;

-- Triggers to update timestamps
create or replace function public.set_updated_at()
returns trigger as $$
begin
	new.updated_at = now();
	return new;
end;
$$ language plpgsql;

create or replace trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- RLS
alter table public.profiles enable row level security;

-- Each user can manage only their row
drop policy if exists "Profiles are viewable by authenticated users" on public.profiles;
create policy "Profiles are viewable by authenticated users" on public.profiles
for select using (auth.role() = 'authenticated');

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile" on public.profiles
for insert with check (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile" on public.profiles
for update using (auth.uid() = id);

-- Flexible profile sections (JSONB) to support custom layouts/sections
create table if not exists public.profile_sections (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    key text not null, -- e.g., 'personal', 'skills', 'projects', custom slug
    title text not null,
    type text not null, -- e.g., 'personal', 'skills', 'custom'
    position int not null default 0,
    content jsonb not null default '{}',
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    unique(user_id, key)
);

create index if not exists profile_sections_user_idx on public.profile_sections(user_id);
create index if not exists profile_sections_position_idx on public.profile_sections(user_id, position);

create or replace trigger profile_sections_set_updated_at
before update on public.profile_sections
for each row execute function public.set_updated_at();

alter table public.profile_sections enable row level security;

drop policy if exists "Profile sections viewable by authenticated users" on public.profile_sections;
create policy "Profile sections viewable by authenticated users" on public.profile_sections
for select using (auth.role() = 'authenticated');

drop policy if exists "Users can insert their own profile sections" on public.profile_sections;
create policy "Users can insert their own profile sections" on public.profile_sections
for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update their own profile sections" on public.profile_sections;
create policy "Users can update their own profile sections" on public.profile_sections
for update using (auth.uid() = user_id);

-- Projects table
create table if not exists public.projects (
	id uuid primary key default gen_random_uuid(),
	name text not null,
	description text,
	meeting_link text,
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
alter table public.projects add column if not exists meeting_link text;
alter table public.projects add column if not exists documentation text;

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

-- Triggers for project tables
create or replace trigger projects_set_updated_at
before update on public.projects
for each row execute function public.set_updated_at();

create or replace trigger project_tasks_set_updated_at
before update on public.project_tasks
for each row execute function public.set_updated_at();

-- Enable RLS for all project tables
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.project_tasks enable row level security;
alter table public.project_messages enable row level security;
alter table public.project_files enable row level security;

-- Helper to avoid recursive RLS checks
create or replace function public.is_project_member(p_project_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.project_members pm
    where pm.project_id = p_project_id and pm.user_id = auth.uid()
  );
$$;

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

-- Project meetings table
create table if not exists public.project_meetings (
	id uuid primary key default gen_random_uuid(),
	project_id uuid references public.projects(id) on delete cascade not null,
	title text not null,
	scheduled_at timestamptz not null,
	duration_minutes integer not null default 60,
	meeting_link text not null,
	notes text,
	created_by uuid references auth.users(id) on delete cascade not null,
	created_at timestamptz default now(),
	updated_at timestamptz default now()
);

-- Project meeting participants table
create table if not exists public.project_meeting_participants (
	id uuid primary key default gen_random_uuid(),
	meeting_id uuid references public.project_meetings(id) on delete cascade not null,
	user_id uuid references auth.users(id) on delete cascade not null,
	role text not null default 'participant' check (role in ('host', 'participant')),
	created_at timestamptz default now(),
	unique (meeting_id, user_id)
);

-- Trigger for project meetings
create or replace trigger project_meetings_set_updated_at
before update on public.project_meetings
for each row execute function public.set_updated_at();

-- Helper function to detect meeting conflicts
create or replace function public.get_meeting_conflicts(
	p_project_id uuid,
	p_participant_ids uuid[],
	p_start timestamptz,
	p_end timestamptz
)
returns table (
	participant_id uuid,
	participant_name text,
	meeting_id uuid,
	meeting_title text,
	scheduled_at timestamptz,
	duration_minutes integer
) as $$
begin
	return query
	select
		p.user_id as participant_id,
		profiles.full_name as participant_name,
		m.id as meeting_id,
		m.title as meeting_title,
		m.scheduled_at,
		m.duration_minutes
	from public.project_meetings m
	join public.project_meeting_participants p on p.meeting_id = m.id
	left join public.profiles on profiles.id = p.user_id
	where
		m.project_id = p_project_id
		and p.user_id = any(p_participant_ids)
		and m.scheduled_at < p_end
		and (m.scheduled_at + (m.duration_minutes * interval '1 minute')) > p_start;
end;
$$ language plpgsql security definer;

-- Projects policies
drop policy if exists "Users can view projects they own or are members of" on public.projects;
create policy "Users can view projects they own or are members of" on public.projects
	for select using (
		-- Owners, members, or users with global project permissions
		auth.uid() = owner_id
		or public.is_project_member(id)
		or public.has_permission('projects.view', null)
		or public.has_permission('projects.manage', null)
	);

drop policy if exists "Users can create projects" on public.projects;
create policy "Users can create projects" on public.projects
	for insert with check (auth.uid() = owner_id);

drop policy if exists "Project owners can update projects" on public.projects;
create policy "Project owners can update projects" on public.projects
	for update using (auth.uid() = owner_id);

drop policy if exists "Project members can update projects" on public.projects;
create policy "Project members can update projects" on public.projects
	for update using (
		auth.uid() = owner_id or 
		auth.uid() in (select user_id from public.project_members where project_id = id)
	) with check (
		auth.uid() = owner_id or 
		auth.uid() in (select user_id from public.project_members where project_id = id)
	);

drop policy if exists "Project owners can delete projects" on public.projects;
create policy "Project owners can delete projects" on public.projects
	for delete using (auth.uid() = owner_id);

-- Project members policies
-- Replace recursive view policy with non-recursive one
DROP POLICY IF EXISTS "Users can view project members" ON public.project_members;
CREATE POLICY "Users can view project members" ON public.project_members
    FOR SELECT USING (
        auth.uid() = user_id OR 
        auth.uid() = (SELECT owner_id FROM public.projects WHERE id = project_members.project_id)
    );

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

-- Project meetings policies
drop policy if exists "Users can view meetings in their projects" on public.project_meetings;
create policy "Users can view meetings in their projects" on public.project_meetings
	for select using (
		auth.uid() in (
			select user_id from public.project_members where project_id = project_meetings.project_id
			union
			select owner_id from public.projects where id = project_meetings.project_id
		)
	);

drop policy if exists "Project members can create meetings" on public.project_meetings;
create policy "Project members can create meetings" on public.project_meetings
	for insert with check (
		auth.uid() = created_by and
		auth.uid() in (
			select user_id from public.project_members where project_id = project_meetings.project_id
			union
			select owner_id from public.projects where id = project_meetings.project_id
		)
	);

drop policy if exists "Project members can update meetings" on public.project_meetings;
create policy "Project members can update meetings" on public.project_meetings
	for update using (
		auth.uid() in (
			select user_id from public.project_members where project_id = project_meetings.project_id
			union
			select owner_id from public.projects where id = project_meetings.project_id
		)
	);

drop policy if exists "Meeting creators or project owners can delete meetings" on public.project_meetings;
create policy "Meeting creators or project owners can delete meetings" on public.project_meetings
	for delete using (
		auth.uid() = created_by or
		auth.uid() = (select owner_id from public.projects where id = project_meetings.project_id)
	);

-- Project meeting participants policies
drop policy if exists "Users can view meeting participants in their projects" on public.project_meeting_participants;
create policy "Users can view meeting participants in their projects" on public.project_meeting_participants
	for select using (
		auth.uid() in (
			select user_id from public.project_members 
			where project_id = (select project_id from public.project_meetings where id = project_meeting_participants.meeting_id)
			union
			select owner_id from public.projects 
			where id = (select project_id from public.project_meetings where id = project_meeting_participants.meeting_id)
		)
	);

drop policy if exists "Project members can manage meeting participants" on public.project_meeting_participants;
create policy "Project members can manage meeting participants" on public.project_meeting_participants
	for all using (
		auth.uid() in (
			select user_id from public.project_members 
			where project_id = (select project_id from public.project_meetings where id = project_meeting_participants.meeting_id)
			union
			select owner_id from public.projects 
			where id = (select project_id from public.project_meetings where id = project_meeting_participants.meeting_id)
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

-- Triggers for new tables
create or replace trigger learning_resources_set_updated_at
before update on public.learning_resources
for each row execute function public.set_updated_at();

-- Enable RLS for new tables
alter table public.learning_resources enable row level security;

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

-- Calendar Availability table (for Hours page)
create table if not exists public.calendar_availability (
	id uuid primary key default gen_random_uuid(),
	user_id uuid references auth.users(id) on delete cascade not null,
	date date not null,
	start_time time not null,
	end_time time not null,
	title text,
	notes text,
	availability_type text not null default 'available' check (availability_type in ('available', 'busy', 'tentative')),
	created_at timestamptz default now(),
	updated_at timestamptz default now()
);

create index if not exists calendar_availability_user_id_idx on public.calendar_availability(user_id);
create index if not exists calendar_availability_date_idx on public.calendar_availability(date);

create or replace trigger calendar_availability_set_updated_at
before update on public.calendar_availability
for each row execute function public.set_updated_at();

alter table public.calendar_availability enable row level security;

drop policy if exists "Users can view their own calendar availability" on public.calendar_availability;
create policy "Users can view their own calendar availability" on public.calendar_availability
	for select using (auth.uid() = user_id);

drop policy if exists "Users can create their own calendar availability" on public.calendar_availability;
create policy "Users can create their own calendar availability" on public.calendar_availability
	for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update their own calendar availability" on public.calendar_availability;
create policy "Users can update their own calendar availability" on public.calendar_availability
	for update using (auth.uid() = user_id);

drop policy if exists "Users can delete their own calendar availability" on public.calendar_availability;
create policy "Users can delete their own calendar availability" on public.calendar_availability
	for delete using (auth.uid() = user_id);

-- Notifications table
-- Note: This table should be recreated using recreate-notifications-table.sql to clear old data
create table if not exists public.notifications (
	id uuid primary key default gen_random_uuid(),
	user_id uuid references auth.users(id) on delete cascade not null,
	type text not null check (type in ('meeting_scheduled', 'meeting_updated', 'meeting_cancelled', 'task_assigned', 'message', 'other')),
	title text not null,
	message text not null,
	related_id uuid, -- ID of related entity (meeting_id, task_id, etc.)
	related_type text, -- Type of related entity ('meeting', 'task', etc.)
	is_read boolean default false,
	created_at timestamptz default now()
);

create index if not exists notifications_user_id_idx on public.notifications(user_id);
create index if not exists notifications_is_read_idx on public.notifications(user_id, is_read);
create index if not exists notifications_created_at_idx on public.notifications(created_at desc);

alter table public.notifications enable row level security;

drop policy if exists "Users can view their own notifications" on public.notifications;
create policy "Users can view their own notifications" on public.notifications
	for select using (auth.uid() = user_id);

drop policy if exists "Users can update their own notifications" on public.notifications;
create policy "Users can update their own notifications" on public.notifications
	for update using (auth.uid() = user_id);

drop policy if exists "System can create notifications" on public.notifications;
create policy "System can create notifications" on public.notifications
	for insert with check (auth.role() = 'authenticated');
