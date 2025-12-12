# Supabase Email Confirmation Setup Guide

## Production URLs
- **Render**: https://whoop-insights.onrender.com
- **Cloud**: https://data-insights.cloud

## Required Supabase Configuration

To enable email confirmation to work on both production URLs, you need to configure Supabase redirect URLs:

### Step 1: Configure Redirect URLs in Supabase

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **Authentication** → **URL Configuration**
4. Under **Redirect URLs**, add the following URLs:

```
http://localhost:3000/auth/callback
https://whoop-insights.onrender.com/auth/callback
https://data-insights.cloud/auth/callback
```

### Step 2: Configure Site URL (Optional but Recommended)

In the same **URL Configuration** section, set the **Site URL** to your primary production domain:
- `https://data-insights.cloud` (or whichever is your primary domain)

### Step 3: Email Templates (Optional)

If you want to customize the email confirmation email:
1. Go to **Authentication** → **Email Templates**
2. Select **Confirm signup**
3. The redirect URL in the email will automatically use the `emailRedirectTo` parameter we set in the code

## How It Works

The application automatically detects the current domain and uses it for redirect URLs:

- **Local development**: Uses `http://localhost:3000/auth/callback`
- **Render deployment**: Uses `https://whoop-insights.onrender.com/auth/callback`
- **Cloud deployment**: Uses `https://data-insights.cloud/auth/callback`

The `getValidSiteUrl()` function in `lib/auth.ts` handles this automatically by:
1. First checking `window.location.origin` (most reliable)
2. Falling back to `NEXT_PUBLIC_SITE_URL` environment variable
3. Finally defaulting to localhost for development

## Environment Variables

For each deployment, you can optionally set:

```bash
NEXT_PUBLIC_SITE_URL=https://whoop-insights.onrender.com
# or
NEXT_PUBLIC_SITE_URL=https://data-insights.cloud
```

This is optional since the code automatically detects the domain, but it can be useful for server-side rendering scenarios.

## Testing

1. **Local**: Sign up at `http://localhost:3000/signup` and check your email
2. **Render**: Sign up at `https://whoop-insights.onrender.com/signup` and check your email
3. **Cloud**: Sign up at `https://data-insights.cloud/signup` and check your email

After clicking the confirmation link in your email, you should be redirected to `/auth/callback` which will:
- Process the confirmation token
- Set your session
- Redirect you to the dashboard

## Troubleshooting

### Issue: "Invalid redirect URL" error
- **Solution**: Make sure all three callback URLs are added to Supabase redirect URLs list

### Issue: Redirects to wrong domain
- **Solution**: Check that `NEXT_PUBLIC_SITE_URL` is set correctly for each deployment, or let the code auto-detect

### Issue: Email confirmation link doesn't work
- **Solution**: 
  1. Verify the callback URL is in Supabase's allowed redirect URLs
  2. Check that the email link includes the correct domain
  3. Ensure the `/auth/callback` route is accessible






















