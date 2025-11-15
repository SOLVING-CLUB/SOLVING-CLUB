# Google OAuth Setup Instructions

## Publishing Your App for All Users

To make your app available to all users (not just test users), you need to publish it in Google Cloud Console. However, apps using sensitive scopes (like Calendar) require Google's verification process.

## Step 1: Publish Your App

### Option A: Quick Publish (For Less Sensitive Scopes)

If you're using basic scopes, you can publish immediately:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **APIs & Services** > **OAuth consent screen**
4. Scroll to the bottom
5. Click **PUBLISH APP**
6. Confirm the publication

### Option B: Verification Required (For Calendar/Meet Scopes)

Since you're using Calendar scopes (`calendar` and `calendar.events`), Google requires verification:

1. Go to **APIs & Services** > **OAuth consent screen**
2. Make sure all required fields are filled:
   - **App name**: SOLVING-CLUB
   - **User support email**: Your email
   - **Developer contact information**: Your email
   - **App domain** (if applicable)
   - **Privacy policy URL** (required for verification)
   - **Terms of service URL** (required for verification)
3. Click **PUBLISH APP**
4. You'll see a warning that verification is required
5. Click **CONFIGURE CONSENT SCREEN** to start verification

### Verification Process

1. **Submit for Verification**:
   - Go to **OAuth consent screen**
   - Click **SUBMIT FOR VERIFICATION**
   - Fill out the verification form:
     - App purpose and functionality
     - Scopes justification (why you need Calendar access)
     - Privacy policy URL (required)
     - Terms of service URL (required)
     - Video demonstration (optional but helpful)
     - Domain verification

2. **Required Documents**:
   - **Privacy Policy**: Must explain how you use Calendar data
   - **Terms of Service**: Legal terms for your app
   - **Domain Verification**: Verify ownership of your domain

3. **Review Time**: Google typically reviews within 1-2 weeks

### Alternative: Use Less Sensitive Scopes (Faster)

If you want to avoid verification, you could:
- Use `calendar.readonly` instead of `calendar` (read-only access)
- Or use a different approach that doesn't require Calendar API

## Step 2: Configure Redirect URI

1. In Google Cloud Console, go to **APIs & Services** > **Credentials**
2. Click on your OAuth 2.0 Client ID (the one ending in `.apps.googleusercontent.com`)
3. Under **Authorized redirect URIs**, make sure you have:
   - `http://localhost:5173/auth/google/callback` (if using port 5173)
   - `http://localhost:5174/auth/google/callback` (if using port 5174)
   - `http://localhost:3000/auth/google/callback` (if using a different port)
   - Add your production URL when ready: `https://yourdomain.com/auth/google/callback`

## Step 3: Verify OAuth Consent Screen

1. Go to **APIs & Services** > **OAuth consent screen**
2. Make sure the following are configured:
   - **User Type**: External (or Internal if using Google Workspace)
   - **App name**: SOLVING-CLUB
   - **User support email**: Your email
   - **Developer contact information**: Your email
   - **Scopes**: 
     - `https://www.googleapis.com/auth/calendar`
     - `https://www.googleapis.com/auth/calendar.events`

## Step 4: Domain Verification (If Required)

If you're using a custom domain:

1. Go to **OAuth consent screen**
2. Under **Authorized domains**, add your domain
3. Verify domain ownership using:
   - DNS TXT record, or
   - HTML file upload

## Current Configuration

- **Client ID**: `70738710958-art5bp2nojgl0l0vl2bv0gjgk1ou5icd.apps.googleusercontent.com`
- **Redirect URI**: `http://localhost:5174/auth/google/callback` (or your current port)
- **Scopes**: Calendar and Calendar Events

## Testing

After adding test users:

1. Make sure you're logged in with one of the test user emails
2. Try connecting Google again in the meeting scheduler
3. You should now be able to grant permissions

## Troubleshooting

### Error 403: access_denied
- **Solution**: Add your email as a test user in Google Cloud Console

### Redirect URI mismatch
- **Solution**: Make sure the redirect URI in Google Cloud Console exactly matches what's in your code (including port number)

### Token exchange fails
- **Solution**: Check that the client secret is correct and that the redirect URI matches

## Security Note

⚠️ **Important**: The client secret is currently in client-side code. For production:
- Move token exchange to a backend server
- Keep client secret on server only
- Use environment variables for sensitive data

