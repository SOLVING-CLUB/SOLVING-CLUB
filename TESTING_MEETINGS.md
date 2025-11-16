# Testing Meeting Feature Without HTTPS

## Option 1: Use Localhost (Easiest - Works on HTTP)

Simply access your app via `http://localhost:5173` instead of the IP address. Localhost works with HTTP for `getUserMedia`.

**Steps:**
1. Make sure your dev server is running: `npm run dev` (in client directory)
2. Open browser to: `http://localhost:5173`
3. Navigate to meetings and test

## Option 2: Enable Browser Flags (Development Only)

Allow insecure origins in your browser for testing:

### Chrome/Edge:
1. Close all Chrome/Edge windows
2. Open terminal and run:
   ```bash
   # macOS
   /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --unsafely-treat-insecure-origin-as-secure=http://192.168.29.10:5173 --user-data-dir=/tmp/chrome-dev
   
   # Or for Edge
   /Applications/Microsoft\ Edge.app/Contents/MacOS/Microsoft\ Edge --unsafely-treat-insecure-origin-as-secure=http://192.168.29.10:5173 --user-data-dir=/tmp/edge-dev
   ```

### Firefox:
1. Open Firefox
2. Go to `about:config`
3. Search for `media.getusermedia.insecure.enabled`
4. Set it to `true`
5. Restart Firefox

### Safari:
Safari doesn't support this flag easily. Use localhost or HTTPS instead.

## Option 3: Test on Mobile (Capacitor)

Mobile apps have different permission models and may work better:

```bash
# Build and test on Android
npm run mobile:android

# Build and test on iOS  
npm run mobile:ios
```

Mobile apps don't have the same HTTP restrictions as web browsers.

## Option 4: Quick HTTPS Setup (Recommended for Production Testing)

Use a simple HTTPS setup with self-signed certificate:

```bash
# Install mkcert (one-time setup)
brew install mkcert  # macOS
# or
# Windows: choco install mkcert
# Linux: See https://github.com/FiloSottile/mkcert

# Create local CA
mkcert -install

# Generate certificate for your IP
cd client
mkcert 192.168.29.10 localhost 127.0.0.1

# This creates: 192.168.29.10+2.pem and 192.168.29.10+2-key.pem
```

Then update `vite.config.ts` to use HTTPS (I can help with this if needed).

## Quick Fix: Just Use Localhost

The simplest solution is to just use `http://localhost:5173`. It works perfectly for development and doesn't require any special setup!

