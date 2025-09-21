# Profile Setup Guide

This guide explains how to set up automatic profile creation for new users and migrate existing users.

## 🎯 Problem Solved

- **Before**: Users could sign up but wouldn't have profiles, causing them to not appear in team member dropdowns
- **After**: All users automatically get profiles with their display name during signup

## 📋 Setup Steps

### 1. Run Database Migrations

Execute these SQL scripts in your Supabase SQL Editor:

#### A. Create Profile Trigger (for new users)
```sql
-- Run: create-profile-trigger.sql
-- This creates a trigger that automatically creates profiles when users sign up
```

#### B. Migrate Existing Users
```sql
-- Run: migrate-existing-users.sql
-- This creates profiles for existing users who don't have them
```

### 2. Updated Signup Form

The signup form now includes:
- ✅ **Full Name field** (required)
- ✅ **Automatic profile creation** during signup
- ✅ **Proper validation** for all fields
- ✅ **Error handling** for profile creation failures

### 3. Database Trigger Benefits

- **Automatic**: Every new user gets a profile automatically
- **Reliable**: Works even if the frontend fails
- **Consistent**: Uses user metadata for display name
- **Secure**: Runs with proper permissions

## 🔧 Technical Details

### Updated Files

1. **`src/lib/validation.ts`**
   - Added `fullName` field to `signupSchema`
   - Required field with proper validation

2. **`src/app/auth/signup/page.tsx`**
   - Added full name input field
   - Updated form validation
   - Automatic profile creation on signup
   - Better error handling

3. **`src/app/(dashboard)/dashboard/hours/page.tsx`**
   - Improved member loading logic
   - Fallback for users without profiles
   - Better debugging and logging

### Database Changes

1. **Trigger Function**: `handle_new_user()`
   - Creates profile automatically on user signup
   - Uses user metadata for display name
   - Handles email as fallback

2. **Migration Script**: `migrate-existing-users.sql`
   - Creates profiles for existing users
   - Provides statistics on migration

## 🚀 How It Works

### New User Signup Flow

1. User fills out signup form (email, password, full name)
2. Supabase creates user account
3. Database trigger automatically creates profile
4. User appears in all team member lists

### Existing User Migration

1. Run migration script
2. Profiles created for users without them
3. Users now appear in team member dropdowns

## ✅ Verification

After setup, verify:

1. **New signups** get profiles automatically
2. **Existing users** appear in team member dropdowns
3. **Console logs** show proper member counts
4. **No more "User XXXXXXXX"** fallback entries

## 🐛 Troubleshooting

### If users still don't appear:

1. Check console logs for error messages
2. Verify trigger was created successfully
3. Run migration script for existing users
4. Check RLS policies on profiles table

### If profile creation fails:

1. Check database permissions
2. Verify trigger function exists
3. Check for constraint violations
4. Review error logs in Supabase

## 📊 Expected Results

- **All 8 users** should appear in dropdown
- **Proper names** instead of "User XXXXXXXX"
- **New signups** work seamlessly
- **No more missing profiles** issues

This solution ensures a smooth user experience and proper team member management! 🎉
