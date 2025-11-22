# Supabase Setup Guide

## Quick Setup (5 minutes)

### Step 1: Get Your Supabase Credentials

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Sign up or log in
3. Create a new project (or select an existing one)
4. Wait for the project to finish initializing
5. Go to **Settings** → **API** in your project
6. Copy the following:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **anon public** key (long string starting with `eyJ...`)

### Step 2: Create `.env.local` File

1. In your project root directory, create a file named `.env.local`
2. Add the following content (replace with your actual values):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**Example:**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjIzOTAyMiwiZXhwIjoxOTMxODE1MDIyfQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Step 3: Restart Your Development Server

After creating the `.env.local` file:

1. Stop your development server (press `Ctrl+C` in the terminal)
2. Start it again:
   ```bash
   npm run dev
   ```

3. Try logging in again - the error should be gone!

## Troubleshooting

### Still getting "Supabase is not configured" error?

1. **Check file name**: Make sure the file is named exactly `.env.local` (with the dot at the start)
2. **Check location**: The file should be in the root directory of your project (same level as `package.json`)
3. **Check format**: Make sure there are no spaces around the `=` sign
4. **Restart server**: Always restart your dev server after creating/modifying `.env.local`
5. **No quotes needed**: Don't wrap the values in quotes

### Can't find Supabase credentials?

- Make sure you're logged into Supabase
- Navigate to: **Your Project** → **Settings** (gear icon) → **API**
- The **Project URL** is under "Project URL" section
- The **anon public** key is under "Project API keys" section (use the `anon` `public` key, not the `service_role` key)

### Still having issues?

Check the console in your browser (F12) and the terminal where your dev server is running for more detailed error messages.

