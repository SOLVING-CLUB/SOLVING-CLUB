-- Create a database function to insert notifications that bypasses RLS
-- This allows authenticated users to create notifications for any user

-- Drop the function if it exists
drop function if exists public.create_notification_for_user(uuid, text, text, text, text, uuid, text);

-- Create the function with SECURITY DEFINER to bypass RLS
create or replace function public.create_notification_for_user(
  p_user_id uuid,
  p_type text,
  p_title text,
  p_message text,
  p_related_id uuid default null,
  p_related_type text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_notification_id uuid;
begin
  -- Insert the notification
  insert into public.notifications (
    user_id,
    type,
    title,
    message,
    related_id,
    related_type
  )
  values (
    p_user_id,
    p_type,
    p_title,
    p_message,
    p_related_id,
    p_related_type
  )
  returning id into v_notification_id;
  
  return v_notification_id;
end;
$$;

-- Grant execute permission to authenticated users
grant execute on function public.create_notification_for_user to authenticated;

-- Create a function to insert multiple notifications at once
drop function if exists public.create_notifications_for_users(jsonb);

create or replace function public.create_notifications_for_users(
  p_notifications jsonb
)
returns table(id uuid, user_id uuid, type text, title text, message text, related_id uuid, related_type text, is_read boolean, created_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Insert all notifications from the JSONB array
  return query
  insert into public.notifications (
    user_id,
    type,
    title,
    message,
    related_id,
    related_type
  )
  select
    (n->>'user_id')::uuid,
    n->>'type',
    n->>'title',
    n->>'message',
    case when n->>'related_id' is not null then (n->>'related_id')::uuid else null end,
    n->>'related_type'
  from jsonb_array_elements(p_notifications) as n
  returning 
    notifications.id,
    notifications.user_id,
    notifications.type,
    notifications.title,
    notifications.message,
    notifications.related_id,
    notifications.related_type,
    notifications.is_read,
    notifications.created_at;
end;
$$;

-- Grant execute permission to authenticated users
grant execute on function public.create_notifications_for_users to authenticated;

