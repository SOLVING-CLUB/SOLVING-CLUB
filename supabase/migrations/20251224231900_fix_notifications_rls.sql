-- Fix RLS policy to ensure notifications can be created for any user
-- The current policy should work, but let's make it more explicit

-- Drop and recreate the INSERT policy to be more permissive
drop policy if exists "System can create notifications" on public.notifications;
create policy "System can create notifications" on public.notifications
	for insert 
	with check (auth.role() = 'authenticated');

-- Verify the policy allows creating notifications for any user_id
-- This policy allows any authenticated user to insert notifications
-- The user_id in the notification can be different from auth.uid()

