-- Remove old notifications table and recreate it fresh
-- This will delete all existing notification data

-- Drop the old notifications table (cascade will handle any dependencies)
drop table if exists public.notifications cascade;

-- Recreate the notifications table
create table public.notifications (
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

-- Create indexes for better query performance
create index notifications_user_id_idx on public.notifications(user_id);
create index notifications_is_read_idx on public.notifications(user_id, is_read);
create index notifications_created_at_idx on public.notifications(created_at desc);

-- Enable Row Level Security
alter table public.notifications enable row level security;

-- RLS Policies
-- Users can view their own notifications
drop policy if exists "Users can view their own notifications" on public.notifications;
create policy "Users can view their own notifications" on public.notifications
	for select using (auth.uid() = user_id);

-- Users can update their own notifications (to mark as read)
drop policy if exists "Users can update their own notifications" on public.notifications;
create policy "Users can update their own notifications" on public.notifications
	for update using (auth.uid() = user_id);

-- Authenticated users can create notifications (for system/other users to create notifications)
drop policy if exists "System can create notifications" on public.notifications;
create policy "System can create notifications" on public.notifications
	for insert with check (auth.role() = 'authenticated');

