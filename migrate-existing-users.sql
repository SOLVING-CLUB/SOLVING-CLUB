-- Create profiles for existing users who don't have them
-- Run this in your Supabase SQL Editor

-- Insert profiles for users who don't have them
INSERT INTO public.profiles (id, full_name, email)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'full_name', au.email),
  au.email
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL
  AND au.email IS NOT NULL;

-- Check how many profiles were created
SELECT 
  COUNT(*) as total_users,
  COUNT(p.id) as users_with_profiles,
  COUNT(*) - COUNT(p.id) as users_without_profiles
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id;
