-- Enable real-time for notifications table
-- This allows real-time subscriptions to work

-- Enable replication for notifications table (if not already added)
do $$
begin
    if not exists (
        select 1 from pg_publication_tables 
        where pubname = 'supabase_realtime' 
        and tablename = 'notifications'
    ) then
        alter publication supabase_realtime add table public.notifications;
    end if;
end $$;

