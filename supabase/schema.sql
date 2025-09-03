-- Profiles table
create table if not exists public.profiles (
	id uuid primary key references auth.users(id) on delete cascade,
	full_name text,
	avatar_url text,
	career_focus text,
	skills text[] default '{}',
	experience text,
	current_status text,
	portfolio text,
	created_at timestamptz default now(),
	updated_at timestamptz default now()
);

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
create policy "Profiles are viewable by authenticated users" on public.profiles
for select using (auth.role() = 'authenticated');

create policy "Users can insert their own profile" on public.profiles
for insert with check (auth.uid() = id);

create policy "Users can update their own profile" on public.profiles
for update using (auth.uid() = id);
