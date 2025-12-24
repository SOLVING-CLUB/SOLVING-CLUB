-- Verify notifications table setup
-- This migration ensures everything is configured correctly

-- Ensure the INSERT policy allows creating notifications for any user
-- The policy should allow authenticated users to insert notifications with any user_id
drop policy if exists "System can create notifications" on public.notifications;
create policy "System can create notifications" on public.notifications
	for insert 
	with check (
		auth.role() = 'authenticated'
		-- This allows any authenticated user to create notifications
		-- The user_id in the notification can be different from auth.uid()
	);

-- Ensure real-time is enabled (this is idempotent)
do $$
begin
    if not exists (
        select 1 from pg_publication_tables 
        where pubname = 'supabase_realtime' 
        and tablename = 'notifications'
    ) then
        alter publication supabase_realtime add table public.notifications;
    end if;
exception
    when others then
        -- If publication doesn't exist or other error, log but don't fail
        raise notice 'Could not add notifications to realtime publication: %', sqlerrm;
end $$;

