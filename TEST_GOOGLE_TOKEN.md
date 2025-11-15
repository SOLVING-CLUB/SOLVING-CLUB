# Testing Google Meet Link Generation

## What I've Fixed

I've implemented multiple fallback methods to capture and use the Google OAuth access token:

1. **Capture from SIGNED_IN event** - Stores token when user signs in
2. **Capture from OAuth callback URL** - Extracts token from callback if available
3. **Use Supabase session** - Checks if Supabase provides provider_token
4. **Fallback to sessionStorage** - Uses stored token as backup

## How to Test

1. **Sign out completely**
2. **Open browser console** (F12)
3. **Sign in with Google**
4. **Check console logs** for:
   - "Captured Google provider_token from SIGNED_IN event"
   - "Stored Google access token from callback URL"
   - "Session provider: google"
   - "Has provider_token: true/false"

5. **Create a meeting** and check console for:
   - "Attempting to generate Google Meet link..."
   - "Using Google access token from sessionStorage"
   - "Found Google provider token in Supabase session"
   - Any error messages from Google API

## If Token is Still Not Available

If the console shows `hasProviderToken: false` and no token is captured, Supabase is not providing the token. In this case:

### Option 1: Check Supabase Dashboard Settings

1. Go to Supabase Dashboard → Authentication → Providers → Google
2. Check if there's a setting to "Return provider token" or "Store provider token"
3. Enable it if available

### Option 2: Use Supabase Edge Function

Create a serverless function that can access the token server-side. I've created a starter function at:
- `supabase/functions/create-google-meet-link/index.ts`

### Option 3: Manual Token Entry (Temporary)

As a last resort, you could add a manual token input field in the meeting scheduler, but this is not ideal.

## Next Steps

1. Test the sign-in flow and check console logs
2. Share the console output so we can see what's happening
3. If token is captured, try creating a meeting
4. If it still doesn't work, we'll implement the Edge Function solution

