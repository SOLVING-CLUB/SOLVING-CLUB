# Fixing Google OAuth Issues in Supabase

## Issues to Fix:
1. Profile details (name, email, avatar) not being fetched when signing in with Google
2. Google Meet link not being generated (provider_token not available)

## Step 1: Run Database Trigger

Run the SQL file to create a trigger that automatically creates/updates profiles:

```sql
-- Run this in Supabase SQL Editor
-- File: supabase/create-profile-trigger.sql
```

This trigger will automatically create/update profiles when users sign up (including Google OAuth).

## Step 2: Configure Supabase to Store Provider Tokens

**Important**: Supabase may not store `provider_token` in the session by default. You have two options:

### Option A: Use Supabase Edge Function (Recommended)

Create a Supabase Edge Function to exchange the code for a token and store it. However, for now, we'll use a workaround.

### Option B: Check Supabase Settings

1. Go to Supabase Dashboard → Authentication → Providers → Google
2. Look for an option like "Store provider token" or "Return provider token"
3. Enable it if available

**Note**: Some Supabase versions don't expose provider_token in the client session for security reasons.

## Step 3: Alternative Solution - Use Refresh Token

If `provider_token` is not available, we can use the refresh token to get a new access token. However, Supabase also may not expose `provider_refresh_token`.

## Step 4: Updated Scopes

I've updated the scopes to include:
- `openid` - Required for OAuth
- `userinfo.email` - To get user email
- `userinfo.profile` - To get user name and picture
- `calendar` - For Google Calendar access
- `calendar.events` - For creating calendar events

## Step 5: Test the Fix

1. **Sign out** completely
2. **Sign in with Google** again
3. Check browser console for:
   - "Profile created/updated successfully"
   - Session details with provider information
4. **Create a meeting** and check console for:
   - "Attempting to generate Google Meet link..."
   - "Google token found" or error messages

## If Provider Token Still Not Available

If `provider_token` is still not available after these steps, we may need to:

1. **Use Supabase Edge Function**: Create a serverless function to handle token exchange
2. **Use Google API directly**: Implement a custom OAuth flow (but this defeats the purpose of using Supabase)
3. **Store token separately**: Use a different storage mechanism (less secure)

## Current Status

- ✅ Profile creation trigger created
- ✅ Scopes updated to include userinfo
- ✅ Enhanced error logging
- ⚠️ Provider token availability depends on Supabase configuration

## Next Steps

1. Run the SQL trigger file
2. Sign out and sign in again with Google
3. Check console logs to see if provider_token is available
4. If not, we'll implement an alternative solution

