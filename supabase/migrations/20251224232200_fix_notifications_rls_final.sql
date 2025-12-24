-- Final fix for notifications RLS policy
-- The issue might be that auth.role() check is not sufficient
-- We need to explicitly allow INSERT for any user_id when the current user is authenticated

-- Drop all existing INSERT policies
drop policy if exists "System can create notifications" on public.notifications;
drop policy if exists "Authenticated users can create notifications" on public.notifications;

-- Create a more permissive INSERT policy
-- This allows any authenticated user to insert notifications for any user_id
create policy "Allow authenticated users to create notifications" on public.notifications
	for insert 
	with check (
		-- Allow if the current user is authenticated
		-- This allows creating notifications for any user_id, not just auth.uid()
		auth.uid() is not null
	);

-- Verify real-time is enabled
do $$
begin
    -- Check if supabase_realtime publication exists
    if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
        -- Add notifications table to realtime if not already added
        if not exists (
            select 1 from pg_publication_tables 
            where pubname = 'supabase_realtime' 
            and tablename = 'notifications'
        ) then
            alter publication supabase_realtime add table public.notifications;
            raise notice 'Added notifications table to realtime publication';
        else
            raise notice 'Notifications table already in realtime publication';
        end if;
    else
        raise notice 'supabase_realtime publication does not exist';
    end if;
exception
    when others then
        raise notice 'Error setting up realtime: %', sqlerrm;
end $$;

