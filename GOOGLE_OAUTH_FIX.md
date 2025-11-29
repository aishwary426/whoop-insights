# Google OAuth Redirect Fix

## Problem
Google OAuth login was redirecting to `localhost:3000` in some instances, causing authentication failures.

## Solution
Fixed the redirect URL handling and added a proper OAuth callback handler.

## Changes Made

### 1. Updated `lib/supabase.ts`
- Improved `signInWithGoogle()` function to handle redirect URLs more robustly
- Added fallback logic for different environments (development, production, Vercel)
- Changed redirect destination from `/dashboard` to `/auth/callback` (proper OAuth flow)
- Added better error handling and logging

### 2. Created `app/auth/callback/route.ts`
- New API route to handle OAuth callbacks from Google
- Exchanges authorization code for session
- Handles errors gracefully
- Redirects to dashboard on success, login page on error

### 3. Updated `app/login/page.tsx` and `app/signup/page.tsx`
- Added error parameter handling from URL query string
- Displays OAuth callback errors to users
- Cleans up URL after displaying error

## How to Configure Supabase

To fix the redirect issue, you need to add the correct redirect URLs in your Supabase project:

### Steps:

1. **Go to Supabase Dashboard**
   - Navigate to your project: https://supabase.com/dashboard
   - Select your project

2. **Go to Authentication Settings**
   - Click on "Authentication" in the left sidebar
   - Click on "URL Configuration" or "Redirect URLs"

3. **Add Redirect URLs**
   
   Add these URLs to the "Redirect URLs" list:
   
   **For Local Development:**
   ```
   http://localhost:3000/auth/callback
   ```
   
   **For Production (replace with your actual domain):**
   ```
   https://yourdomain.com/auth/callback
   https://your-app.vercel.app/auth/callback
   ```
   
   **Important:** Make sure to include:
   - `http://localhost:3000/auth/callback` for local development
   - Your production domain's callback URL
   - Any staging/preview URLs if using Vercel preview deployments

4. **Site URL Configuration**
   
   Set the "Site URL" to your production domain:
   ```
   https://yourdomain.com
   ```
   
   Or for local development:
   ```
   http://localhost:3000
   ```

5. **Save Changes**
   - Click "Save" to apply the changes

## Environment Variables

Make sure your `.env.local` file has:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SITE_URL=https://yourdomain.com  # Optional: for production
```

**For Local Development:**
- You can omit `NEXT_PUBLIC_SITE_URL` - it will use `window.location.origin`

**For Production:**
- Set `NEXT_PUBLIC_SITE_URL` to your production domain
- This ensures consistent redirect URLs across all environments

## Testing

1. **Test Local Development:**
   - Start your dev server: `npm run dev`
   - Go to `http://localhost:3000/login`
   - Click "Continue with Google"
   - Should redirect to Google → back to `/auth/callback` → `/dashboard`

2. **Test Production:**
   - Deploy your app
   - Make sure `NEXT_PUBLIC_SITE_URL` is set correctly
   - Test Google OAuth login
   - Should work consistently

## Troubleshooting

### Still redirecting to localhost:3000 in production?
- Check that `NEXT_PUBLIC_SITE_URL` is set in your production environment
- Verify the redirect URL in Supabase matches your production domain exactly
- Check browser console for errors

### Getting "redirect_uri_mismatch" error?
- Make sure `/auth/callback` is added to Supabase redirect URLs
- Verify the URL matches exactly (including protocol: http vs https)
- Check for trailing slashes

### OAuth works but user isn't logged in?
- Check browser console for errors
- Verify Supabase session is being created in the callback route
- Check that cookies are enabled

## How It Works Now

1. User clicks "Continue with Google" on login/signup page
2. `signInWithGoogle()` constructs redirect URL: `{siteUrl}/auth/callback`
3. User is redirected to Google OAuth consent screen
4. After consent, Google redirects to `/auth/callback?code=...`
5. Callback route exchanges code for session
6. User is redirected to `/dashboard` with active session

This follows the standard OAuth 2.0 authorization code flow.























