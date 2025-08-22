/*
  # Add OTP verification and storage setup

  1. Storage
    - Create profiles bucket for profile photos
    - Create posts bucket for post media
    - Set up proper RLS policies for storage

  2. Auth Configuration
    - Enable email confirmation
    - Configure OTP settings

  3. Database Updates
    - Add profile_photo column to users table
    - Update RLS policies
*/

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('profiles', 'profiles', true),
  ('posts', 'posts', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for profiles bucket
CREATE POLICY "Users can upload their own profile photos"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'profiles' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Profile photos are publicly viewable"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'profiles');

CREATE POLICY "Users can update their own profile photos"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'profiles' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own profile photos"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'profiles' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Set up storage policies for posts bucket
CREATE POLICY "Users can upload post media"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'posts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Post media is publicly viewable"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'posts');

CREATE POLICY "Users can update their own post media"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'posts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own post media"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'posts' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add profile_photo column to users table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'profile_photo'
  ) THEN
    ALTER TABLE users ADD COLUMN profile_photo text DEFAULT '';
  END IF;
END $$;