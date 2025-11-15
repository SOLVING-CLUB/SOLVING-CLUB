-- Meetings table
create table if not exists public.meetings (
	id uuid primary key default gen_random_uuid(),
	project_id uuid references public.projects(id) on delete cascade,
	title text not null,
	description text,
	meeting_date timestamptz not null,
	duration_minutes integer not null default 60,
	google_meet_link text,
	organizer_id uuid references auth.users(id) on delete cascade not null,
	created_at timestamptz default now(),
	updated_at timestamptz default now()
);

-- Meeting participants table
create table if not exists public.meeting_participants (
	id uuid primary key default gen_random_uuid(),
	meeting_id uuid references public.meetings(id) on delete cascade not null,
	user_id uuid references auth.users(id) on delete cascade not null,
	status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'tentative')),
	created_at timestamptz default now(),
	unique (meeting_id, user_id)
);

-- Notifications table
create table if not exists public.notifications (
	id uuid primary key default gen_random_uuid(),
	user_id uuid references auth.users(id) on delete cascade not null,
	type text not null check (type in ('meeting_invite', 'meeting_reminder', 'task_assigned', 'task_due', 'task_updated', 'project_update')),
	title text not null,
	message text not null,
	related_id uuid, -- Can reference meeting_id, task_id, project_id, etc.
	related_type text, -- 'meeting', 'task', 'project'
	is_read boolean not null default false,
	created_at timestamptz default now()
);

-- Triggers
create or replace trigger meetings_set_updated_at
before update on public.meetings
for each row execute function public.set_updated_at();

-- Indexes for performance
create index if not exists meetings_project_idx on public.meetings(project_id);
create index if not exists meetings_organizer_idx on public.meetings(organizer_id);
create index if not exists meetings_date_idx on public.meetings(meeting_date);
create index if not exists meeting_participants_meeting_idx on public.meeting_participants(meeting_id);
create index if not exists meeting_participants_user_idx on public.meeting_participants(user_id);
create index if not exists notifications_user_idx on public.notifications(user_id);
create index if not exists notifications_read_idx on public.notifications(user_id, is_read);
create index if not exists notifications_created_idx on public.notifications(created_at desc);

-- Enable RLS
alter table public.meetings enable row level security;
alter table public.meeting_participants enable row level security;
alter table public.notifications enable row level security;

-- Helper functions to avoid RLS recursion
-- These use security definer to bypass RLS and break the circular dependency
create or replace function public.is_meeting_participant(meeting_uuid uuid, user_uuid uuid)
returns boolean as $$
begin
	return exists (
		select 1 from public.meeting_participants
		where meeting_id = meeting_uuid and user_id = user_uuid
	);
end;
$$ language plpgsql security definer stable;

create or replace function public.is_meeting_organizer(meeting_uuid uuid, user_uuid uuid)
returns boolean as $$
begin
	return exists (
		select 1 from public.meetings
		where id = meeting_uuid and organizer_id = user_uuid
	);
end;
$$ language plpgsql security definer stable;

-- Meetings policies
drop policy if exists "Users can view meetings they organize or are invited to" on public.meetings;
create policy "Users can view meetings they organize or are invited to" on public.meetings
	for select using (
		auth.uid() = organizer_id or
		public.is_meeting_participant(id, auth.uid())
	);

drop policy if exists "Users can create meetings" on public.meetings;
create policy "Users can create meetings" on public.meetings
	for insert with check (auth.uid() = organizer_id);

drop policy if exists "Organizers can update meetings" on public.meetings;
create policy "Organizers can update meetings" on public.meetings
	for update using (auth.uid() = organizer_id);

drop policy if exists "Organizers can delete meetings" on public.meetings;
create policy "Organizers can delete meetings" on public.meetings
	for delete using (auth.uid() = organizer_id);

-- Meeting participants policies
drop policy if exists "Users can view meeting participants" on public.meeting_participants;
create policy "Users can view meeting participants" on public.meeting_participants
	for select using (
		auth.uid() = user_id or
		public.is_meeting_organizer(meeting_id, auth.uid())
	);

drop policy if exists "Organizers can manage participants" on public.meeting_participants;
create policy "Organizers can manage participants" on public.meeting_participants
	for all using (
		public.is_meeting_organizer(meeting_id, auth.uid())
	);

drop policy if exists "Users can update their own participant status" on public.meeting_participants;
create policy "Users can update their own participant status" on public.meeting_participants
	for update using (auth.uid() = user_id);

-- Notifications policies
drop policy if exists "Users can view their own notifications" on public.notifications;
create policy "Users can view their own notifications" on public.notifications
	for select using (auth.uid() = user_id);

drop policy if exists "System can create notifications" on public.notifications;
create policy "System can create notifications" on public.notifications
	for insert with check (true); -- Allow system to create notifications

drop policy if exists "Users can update their own notifications" on public.notifications;
create policy "Users can update their own notifications" on public.notifications
	for update using (auth.uid() = user_id);

drop policy if exists "Users can delete their own notifications" on public.notifications;
create policy "Users can delete their own notifications" on public.notifications
	for delete using (auth.uid() = user_id);

-- Function to create notifications when meeting participants are added
create or replace function public.create_meeting_participant_notification()
returns trigger as $$
declare
	meeting_record record;
begin
	-- Get meeting details
	select title into meeting_record from public.meetings where id = new.meeting_id;
	
	-- Create notification for the participant
	insert into public.notifications (user_id, type, title, message, related_id, related_type)
	values (
		new.user_id,
		'meeting_invite',
		'New Meeting Invitation',
		'You have been invited to: ' || meeting_record.title,
		new.meeting_id,
		'meeting'
	);
	
	return new;
end;
$$ language plpgsql security definer;

-- Trigger to create notifications when participants are added
drop trigger if exists meeting_participants_notification_trigger on public.meeting_participants;
create trigger meeting_participants_notification_trigger
after insert on public.meeting_participants
for each row execute function public.create_meeting_participant_notification();

-- Function to create notifications when tasks are assigned
create or replace function public.create_task_assignment_notification()
returns trigger as $$
begin
	-- For INSERT: create notification if assigned_to is not null
	-- For UPDATE: create notification if assigned_to changed and is not null
	if new.assigned_to is not null then
		if (TG_OP = 'INSERT') or (TG_OP = 'UPDATE' and (old.assigned_to is distinct from new.assigned_to)) then
			insert into public.notifications (user_id, type, title, message, related_id, related_type)
			values (
				new.assigned_to,
				'task_assigned',
				'New Task Assigned',
				'You have been assigned a new task: ' || new.title,
				new.id,
				'task'
			);
		end if;
	end if;
	return new;
end;
$$ language plpgsql security definer;

-- Trigger to create notifications when tasks are assigned
drop trigger if exists task_assignment_notification_trigger on public.project_tasks;
create trigger task_assignment_notification_trigger
after insert or update of assigned_to on public.project_tasks
for each row execute function public.create_task_assignment_notification();

