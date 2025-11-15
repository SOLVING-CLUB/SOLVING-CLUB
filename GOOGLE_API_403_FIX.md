# Fixing Google API 403 Forbidden Error

## The Problem

You're getting a **403 Forbidden** error when trying to create Google Meet links. This means the token is working, but Google is rejecting the request due to missing permissions or configuration.

## Common Causes:

1. **Calendar API not enabled** in Google Cloud Console
2. **Missing OAuth scopes** - The token doesn't have `calendar` and `calendar.events` scopes
3. **OAuth consent screen not verified/published** - Required for sensitive scopes
4. **User hasn't granted Calendar permissions** during sign-in

## Solutions:

### Step 1: Enable Calendar API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to **APIs & Services** → **Library**
4. Search for "Google Calendar API"
5. Click **Enable**

### Step 2: Verify OAuth Scopes

The scopes should include:
- `https://www.googleapis.com/auth/calendar`
- `https://www.googleapis.com/auth/calendar.events`

Check `client/src/lib/config.ts` to ensure these scopes are included.

### Step 3: Re-authenticate User

The user needs to sign out and sign in again with Google to grant the Calendar permissions:

1. **Sign out** completely
2. **Sign in with Google** again
3. **Grant Calendar permissions** when prompted
4. Try creating a meeting again

### Step 4: Check OAuth Consent Screen

1. Go to Google Cloud Console → **APIs & Services** → **OAuth consent screen**
2. Ensure the app is in **Testing** mode (for development) or **Published** (for production)
3. For sensitive scopes like Calendar, you may need to:
   - Add test users
   - Submit for verification (if publishing)

### Step 5: Verify Redirect URI

Ensure the redirect URI in Google Cloud Console matches:
- `https://knkybbflxkqexjdfcnvt.supabase.co/auth/v1/callback`
- Or your custom callback URL

## Quick Test:

After enabling the Calendar API and re-authenticating, check the console logs. You should see:
- "Found Google provider token in Supabase session"
- Successful API response (200 OK) instead of 403

## If Still Not Working:

Check the detailed error message in the console. The error object will tell you exactly what's missing:
- `"Calendar API has not been used"` → Enable Calendar API
- `"Insufficient Permission"` → Missing scopes or user hasn't granted permissions
- `"Access blocked"` → OAuth consent screen needs verification

