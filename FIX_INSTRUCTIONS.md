# Step-by-Step Fix Instructions

## Issue 1: Profile Details Not Being Fetched

### Solution: Run Database Trigger

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard/project/knkybbflxkqexjdfcnvt
   - Navigate to **SQL Editor**

2. **Run the Trigger SQL**
   - Copy the contents of `supabase/create-profile-trigger.sql`
   - Paste into SQL Editor
   - Click **Run**

This will automatically create/update profiles when users sign in with Google.

## Issue 2: Google Meet Link Not Generated

### The Problem:
Supabase may not store `provider_token` in the client session by default for security reasons.

### Solution Options:

#### Option A: Check Supabase Settings (First Try This)

1. **Go to Supabase Dashboard**
   - Authentication → Providers → Google
   - Look for any setting related to "Store provider token" or "Return provider token"
   - Enable it if available

#### Option B: Use Supabase Edge Function (If Option A Doesn't Work)

If `provider_token` is not available, we need to create a Supabase Edge Function to handle token exchange server-side.

#### Option C: Check Browser Console First

1. **Sign out** completely
2. **Sign in with Google** again
3. **Open browser console** (F12)
4. **Look for logs**:
   - "Session provider: google"
   - "Has provider_token: true/false"
   - "Has provider_refresh_token: true/false"

**If you see `hasProviderToken: false`**, then Supabase is not storing the token and we need Option B.

## Quick Test Steps:

1. ✅ Run the SQL trigger (`supabase/create-profile-trigger.sql`)
2. ✅ Sign out completely
3. ✅ Sign in with Google
4. ✅ Check browser console for session details
5. ✅ Check if profile was created (go to Profile page)
6. ✅ Try creating a meeting and check console logs

## What I've Fixed:

1. ✅ **Added userinfo scopes** - Now requests name, email, and picture from Google
2. ✅ **Created database trigger** - Auto-creates profiles on signup
3. ✅ **Enhanced profile creation** - Backup logic in App.tsx
4. ✅ **Added detailed logging** - To help debug token issues

## Next Steps Based on Console Output:

### If `hasProviderToken: true`:
- Everything should work! Try creating a meeting.

### If `hasProviderToken: false`:
- We need to implement a Supabase Edge Function
- Or use an alternative approach to get the Google access token

**Please run the SQL trigger and test again, then share the console logs!**

