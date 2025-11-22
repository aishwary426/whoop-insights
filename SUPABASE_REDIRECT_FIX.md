# Fix: Google OAuth Redirecting to Localhost

## Problem
After signing up with Google, users are redirected to `localhost` instead of the production URL.

## Solution Applied

### 1. Code Changes
- Updated `lib/supabase.ts` to use `NEXT_PUBLIC_SITE_URL` environment variable
- Updated `lib/supabase.js` (if exists) with same fix
- Updated `app/forgot-password/page.tsx` for password reset redirects

The code now checks for `NEXT_PUBLIC_SITE_URL` first, then falls back to `window.location.origin`.

### 2. Required Configuration

#### A. Set Environment Variable on Render

1. Go to your Render dashboard
2. Navigate to your service → **Environment** tab
3. Add a new environment variable:
   ```
   NEXT_PUBLIC_SITE_URL=https://whoop-insights.onrender.com
   ```
   (Replace with your actual Render URL)

4. **Important:** Restart/redeploy your service after adding the variable

#### B. Configure Supabase Redirect URLs

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Authentication** → **URL Configuration**
4. In **Redirect URLs**, add:
   ```
   https://whoop-insights.onrender.com/dashboard
   https://whoop-insights.onrender.com/reset-password
   http://localhost:3000/dashboard
   http://localhost:3000/reset-password
   ```
   (Replace with your actual Render URL)

5. Click **Save**

#### C. Configure Google OAuth (if not already done)

1. In Supabase Dashboard → **Authentication** → **Providers**
2. Click on **Google**
3. Enable Google provider
4. Add your **Google Client ID** and **Google Client Secret**
5. In **Authorized redirect URIs** for Google, add:
   ```
   https://your-project-id.supabase.co/auth/v1/callback
   ```
   (This is your Supabase project callback URL)

6. Click **Save**

## Verification

After applying these changes:

1. **Redeploy on Render** with the new environment variable
2. **Test Google signup** - should redirect to your production URL
3. **Check browser console** for any errors
4. **Verify Supabase logs** for OAuth flow

## Troubleshooting

### Still redirecting to localhost?

1. **Check environment variable is set:**
   - Verify `NEXT_PUBLIC_SITE_URL` is in Render dashboard
   - Check it's set to your production URL (not localhost)
   - Ensure no trailing slash

2. **Verify Supabase redirect URLs:**
   - Check Supabase dashboard → Authentication → URL Configuration
   - Ensure production URL is in the list
   - URLs are case-sensitive and must match exactly

3. **Clear browser cache/cookies:**
   - OAuth redirect URLs might be cached
   - Try incognito/private browsing

4. **Check Render logs:**
   - Look for environment variable loading errors
   - Verify the variable is available at build time

### Common Issues

**Issue:** "redirect_uri_mismatch" error
**Fix:** Make sure your Supabase redirect URLs list includes the exact URL being used

**Issue:** Still seeing localhost in redirect
**Fix:** 
- Ensure `NEXT_PUBLIC_SITE_URL` is set correctly
- Rebuild/redeploy after adding the variable
- Check that variable name has `NEXT_PUBLIC_` prefix (required for client-side access)

**Issue:** Works locally but not in production
**Fix:** 
- Verify Render environment variables are set
- Check that Next.js build includes the variable (build logs)
- Ensure no `.env.local` file is being used in production

## Additional Notes

- The `NEXT_PUBLIC_SITE_URL` variable must be set at **build time** for Next.js
- If you change the variable, you need to **rebuild** your app
- For Render, environment variables are available at runtime but `NEXT_PUBLIC_` variables are baked into the build
- Consider setting this in your `render.yaml` or Render dashboard **before** first deployment

