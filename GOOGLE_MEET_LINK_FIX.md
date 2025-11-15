# Fix for Google Meet Link Generation

## The Problem

Supabase does **not** expose `provider_token` in the client-side session for security reasons. This means we cannot directly access the Google OAuth access token from the browser to create Google Meet links.

## Solution: Store Token After OAuth Callback

We need to capture and store the Google access token immediately after the OAuth callback, before Supabase processes it.

## Implementation Steps

### Step 1: Update OAuth Callback to Extract Token

The token is available in the URL hash during the OAuth callback. We need to extract it and store it securely.

### Step 2: Store Token in Database

Create a table to store Google tokens securely (encrypted or in a secure column).

### Step 3: Use Stored Token for API Calls

Retrieve the stored token when creating Google Meet links.

## Alternative: Use Supabase Edge Function

Create a serverless function that can access the provider token server-side.

## Quick Fix: Manual Token Storage

For now, let's implement a solution that:
1. Extracts the token from the OAuth callback URL
2. Stores it in localStorage (temporary, not ideal for production)
3. Uses it for Google Meet link generation

**Note**: For production, you should:
- Store tokens in a secure database table
- Encrypt tokens at rest
- Use Supabase Edge Functions for server-side token access
- Implement token refresh logic

