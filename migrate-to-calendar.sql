-- Migration script to transition from weekly_hours + availability_blocks to calendar_availability
-- Run this script in your Supabase SQL Editor

-- Step 1: Create the new calendar_availability table (if not exists)
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
	updated_at timestamptz default now(),
	check (end_time > start_time)
);

-- Step 2: Add indexes and triggers
create index if not exists calendar_availability_user_date_idx on public.calendar_availability(user_id, date);
create index if not exists calendar_availability_date_idx on public.calendar_availability(date);

create or replace trigger calendar_availability_set_updated_at
before update on public.calendar_availability
for each row execute function public.set_updated_at();

-- Step 3: Enable RLS
alter table public.calendar_availability enable row level security;

-- Step 4: Create policies
drop policy if exists "Users can view calendar availability" on public.calendar_availability;
create policy "Users can view calendar availability" on public.calendar_availability
	for select using (auth.role() = 'authenticated');

drop policy if exists "Users can manage their calendar availability" on public.calendar_availability;
create policy "Users can manage their calendar availability" on public.calendar_availability
	for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Step 5: Migrate existing availability_blocks data (if table exists)
do $$
begin
	if exists (select from information_schema.tables where table_name = 'availability_blocks' and table_schema = 'public') then
		insert into public.calendar_availability (user_id, date, start_time, end_time, availability_type, created_at, updated_at)
		select 
			user_id, 
			date, 
			start_time, 
			end_time, 
			'available' as availability_type,
			created_at, 
			updated_at
		from public.availability_blocks
		on conflict do nothing;
		
		raise notice 'Migrated data from availability_blocks to calendar_availability';
	else
		raise notice 'No availability_blocks table found, skipping migration';
	end if;
end $$;

-- Step 6: Optional - Drop old tables (UNCOMMENT ONLY IF YOU'RE SURE)
-- WARNING: This will permanently delete your old data!
-- drop table if exists public.availability_blocks;
-- drop table if exists public.weekly_hours;

-- Migration complete!
-- Your hours page will now use the new calendar_availability table
-- The old weekly hours model has been replaced with flexible calendar-based availability
