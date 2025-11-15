# Google Meet API Setup (Without Calendar)

## Overview

This app creates Google Meet links directly using the Google Meet API, without using Google Calendar. You just need to enable the Meet API and grant the correct permissions.

## Step 1: Enable Google Meet API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **APIs & Services** → **Library**
4. Search for **"Google Meet API"**
5. Click **Enable**

## Step 2: Verify OAuth Scopes

The app requests this scope for Meet API:
- `https://www.googleapis.com/auth/meetings.space.created`

This is already configured in `client/src/lib/config.ts`.

## Step 3: Re-authenticate User

After enabling the Meet API, the user needs to sign out and sign in again:

1. **Sign out** completely from the app
2. **Sign in with Google** again
3. **Grant permissions** when prompted (should include Meet API access)
4. Try creating a meeting again

## Step 4: Check OAuth Consent Screen

1. Go to Google Cloud Console → **APIs & Services** → **OAuth consent screen**
2. Ensure your app is configured correctly
3. For development, you can keep it in **Testing** mode
4. Add test users if needed

## Step 5: Verify Redirect URI

Make sure this redirect URI is added in Google Cloud Console:
- `https://knkybbflxkqexjdfcnvt.supabase.co/auth/v1/callback`

## Testing

After setup:
1. Sign out and sign in with Google
2. Create a meeting
3. Check console logs - you should see:
   - "Using Google access token to create Meet link directly"
   - Successful API response (200 OK)
   - A Google Meet link generated

## Troubleshooting

### 403 Forbidden Error

If you still get 403:
1. **Double-check Meet API is enabled** (not Calendar API)
2. **Verify the scope** is included in OAuth request
3. **Re-authenticate** - sign out and sign in again
4. **Check console** for detailed error message

### API Not Found (404)

If you get 404:
- The Meet API endpoint might have changed
- Check Google's latest Meet API documentation
- The API might require a different version or endpoint

## Notes

- **No Calendar needed** - This approach doesn't use Google Calendar at all
- **Direct Meet links** - Creates Meet links that can be used independently
- **Your own calendar** - You can store these links in your own calendar system

