-- Admin access support for Solving Club
alter table public.profiles add column if not exists is_admin boolean default false;

drop policy if exists "Admins can update any profile" on public.profiles;
create policy "Admins can update any profile" on public.profiles
for update using (
	exists (
		select 1 from public.profiles p
		where p.id = auth.uid() and p.is_admin = true
	)
);

-- Optional: promote a specific user by id (replace UUID)
-- update public.profiles set is_admin = true where id = '00000000-0000-0000-0000-000000000000';
