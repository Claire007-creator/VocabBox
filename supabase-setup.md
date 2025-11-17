# Supabase Setup Instructions (OPTIONAL - For Future Use)

> **⚠️ IMPORTANT**: Your app works perfectly WITHOUT Supabase. This guide is for when you're ready to add cloud sync in the future. You can skip this entirely and continue using localStorage-only mode.

## Current Status

- ✅ App is fully functional with localStorage only
- ✅ No Supabase account needed
- ✅ No backend required
- ⏳ Supabase is optional for future cloud sync

## When to Enable Supabase

Only enable Supabase when you want:
- Cloud sync across devices
- Data backup in the cloud
- Multi-device access
- Better data persistence

## Step 1: Create Supabase Account (When Ready)

1. Go to https://supabase.com
2. Sign up for a free account
3. Create a new project
4. Wait for the project to be set up (takes 1-2 minutes)

## Step 2: Get Your API Keys

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the following:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (the `anon` key, safe to use in client-side code)

## Step 3: Configure the App

1. Open `config.js` in your project
2. Update the `supabase` section:
   ```javascript
   supabase: {
       url: 'YOUR_PROJECT_URL_HERE',
       anonKey: 'YOUR_ANON_KEY_HERE',
   },
   ```
3. Set `useSupabase: true` in the features section

## Step 4: Create Database Tables

Run these SQL commands in your Supabase SQL Editor (Dashboard → SQL Editor):

```sql
-- Create cards table
CREATE TABLE IF NOT EXISTS cards (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    card_data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create folders table
CREATE TABLE IF NOT EXISTS folders (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    folder_data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cards_user_id ON cards(user_id);
CREATE INDEX IF NOT EXISTS idx_folders_user_id ON folders(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (users can only access their own data)
CREATE POLICY "Users can view their own cards"
    ON cards FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cards"
    ON cards FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cards"
    ON cards FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cards"
    ON cards FOR DELETE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own folders"
    ON folders FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own folders"
    ON folders FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own folders"
    ON folders FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own folders"
    ON folders FOR DELETE
    USING (auth.uid() = user_id);
```

## Step 5: Configure Authentication

1. In Supabase Dashboard, go to **Authentication** → **Providers**
2. Enable **Email** provider (already enabled by default)
3. (Optional) Configure email templates in **Authentication** → **Email Templates**

## Step 6: Update Authentication Code

The app will need to be updated to use Supabase Auth instead of localStorage. This requires:
- Replacing localStorage-based auth with Supabase Auth
- Updating sign in/sign up handlers
- Storing user ID from Supabase session

## Important Notes

- The `anon` key is safe to expose in client-side code
- Row Level Security (RLS) ensures users can only access their own data
- Data is automatically backed up in Supabase
- Free tier includes 500MB database storage and 2GB bandwidth
- The app will fall back to localStorage if Supabase is not configured

## Testing

1. After setup, check browser console for `[Supabase] Client initialized successfully`
2. Sign up a new user
3. Create some cards
4. Check Supabase dashboard → Table Editor → cards table to see your data

## Migration from localStorage

Once Supabase is set up, users can:
1. Export their current data (Export button)
2. Sign up/log in with Supabase
3. Import their data (Import button)
4. Data will then sync to cloud automatically

