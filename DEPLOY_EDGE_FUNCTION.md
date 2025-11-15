# Deploy Supabase Edge Function for Google Meet Links

## The Problem

Google's APIs don't allow direct calls from the browser due to CORS restrictions. We need to use a Supabase Edge Function (serverless function) to call Google's API server-side.

## Step 1: Install Supabase CLI

If you haven't already:

```bash
npm install -g supabase
```

Or using other package managers:
- `brew install supabase/tap/supabase` (macOS)
- `scoop bucket add supabase https://github.com/supabase/scoop-bucket.git` (Windows)
- `scoop install supabase` (Windows)

## Step 2: Login to Supabase

```bash
supabase login
```

## Step 3: Link Your Project

```bash
supabase link --project-ref knkybbflxkqexjdfcnvt
```

## Step 4: Deploy the Edge Function

```bash
supabase functions deploy create-meet-link
```

## Step 5: Set Environment Variables (if needed)

The Edge Function uses:
- `SUPABASE_URL` - Automatically available
- `SUPABASE_SERVICE_ROLE_KEY` - Automatically available

These are set automatically by Supabase, so you don't need to configure them.

## Step 6: Test the Function

After deployment, try creating a meeting. The app will now call the Edge Function instead of Google's API directly.

## Troubleshooting

### Function Not Found Error

If you get "Function not found":
1. Make sure you've deployed the function: `supabase functions deploy create-meet-link`
2. Check the function name matches exactly: `create-meet-link`

### Access Token Not Found

If the Edge Function can't find the Google access token:
1. The user needs to sign out and sign in again with Google
2. The token might be stored in a different location - check the Edge Function logs

### Check Function Logs

```bash
supabase functions logs create-meet-link
```

## Alternative: Manual Deployment via Supabase Dashboard

1. Go to Supabase Dashboard → Edge Functions
2. Click "Create a new function"
3. Name it `create-meet-link`
4. Copy the code from `supabase/functions/create-meet-link/index.ts`
5. Deploy

## Notes

- The Edge Function runs server-side, so CORS is not an issue
- The function has access to the user's Google OAuth token via Supabase Auth
- The function calls Google's Meet API and returns the link to the client

