# Supabase Localhost Redirect URLs Setup

To allow OAuth authentication to work with any localhost port, you can use **wildcard patterns** in Supabase!

## Quick Setup (Recommended)

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to: **Authentication** → **URL Configuration**
4. Under **"Redirect URLs"**, click **"Add URL"**
5. Add these **wildcard patterns**:
   - `http://localhost:*/**` (matches ALL localhost ports and paths)
   - `http://127.0.0.1:*/**` (matches ALL 127.0.0.1 ports and paths)
6. Click **"Save"**

That's it! These wildcard patterns will match any localhost URL regardless of port.

## Alternative: Individual URLs (if wildcards don't work)

If for some reason wildcards don't work in your Supabase project, you can add individual URLs:

```
http://localhost:3000/auth/callback
http://localhost:3001/auth/callback
http://localhost:3002/auth/callback
http://127.0.0.1:3000/auth/callback
http://127.0.0.1:3001/auth/callback
http://127.0.0.1:3002/auth/callback
```

## Notes

- **Wildcard patterns** (`http://localhost:*/**`) are the easiest solution
- The `*` matches any port number
- The `**` matches any path
- For production, add your production URL: `https://yourdomain.com/auth/callback`

## Verify Google OAuth is Enabled

Also ensure:
- **Authentication** → **Providers** → **Google** is enabled
- Your Google OAuth credentials are configured in Supabase (if using custom credentials)

