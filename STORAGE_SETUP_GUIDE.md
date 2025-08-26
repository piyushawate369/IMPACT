# Storage Setup Guide

## Problem
You're getting the error: "Storage bucket not configured. Please contact support."

This happens because the storage buckets (`posts` and `profiles`) don't exist in your Supabase project.

## Solution

### Step 1: Access Supabase Dashboard
1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sign in to your account
3. Select your project: `vclgqaermjxdnchifmli`

### Step 2: Open SQL Editor
1. In the left sidebar, click on **SQL Editor**
2. Click **New Query** to create a new SQL script

### Step 3: Run the Storage Setup Script
1. Copy the entire contents of the `create-storage-buckets.sql` file
2. Paste it into the SQL Editor
3. Click **Run** to execute the script

### Step 4: Verify the Setup
After running the script, you should see:
- A list of existing buckets (initially empty)
- The newly created `posts` and `profiles` buckets
- A success message: "Storage buckets created successfully!"

### Step 5: Test the Setup
Run this command in your terminal to verify everything is working:
```bash
node test-storage.js
```

You should see:
```
✅ Buckets found: ['posts', 'profiles']
✅ Posts bucket: { name: 'posts', public: true, ... }
✅ Profiles bucket: { name: 'profiles', public: true, ... }
```

## What This Script Does

1. **Creates Storage Buckets:**
   - `posts` bucket for storing post images/videos (10MB limit)
   - `profiles` bucket for storing profile photos (5MB limit)

2. **Sets Up Security Policies:**
   - Users can upload their own media
   - Media is publicly viewable
   - Users can update/delete their own media

3. **Configures File Types:**
   - Images: JPEG, JPG, PNG, GIF, WebP
   - Videos: MP4, WebM

## After Setup

Once the storage buckets are created, you should be able to:
- Upload images when creating posts
- See images in the community feed
- Upload profile photos

## Troubleshooting

If you still get errors after running the script:

1. **Check the SQL Editor output** - Make sure there are no error messages
2. **Verify buckets exist** - Run `node test-storage.js` to check
3. **Check browser console** - Look for any JavaScript errors
4. **Try logging out and back in** - Sometimes authentication tokens need to be refreshed

## Need Help?

If you're still having issues:
1. Check the Supabase dashboard for any error messages
2. Look at the browser console for JavaScript errors
3. Make sure your `.env` file has the correct Supabase credentials

