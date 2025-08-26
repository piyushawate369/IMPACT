// Direct fix for storage buckets using Supabase REST API
import fetch from 'node-fetch';

const SUPABASE_URL = 'https://vclgqaermjxdnchifmli.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjbGdxYWVybWp4ZG5jaGlmbWxpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0MzM5OTQsImV4cCI6MjA2OTAwOTk5NH0.SN-rOT_Gz-QIlN6uB0jnbDxUmLBsP34Oqr-i4hfpwiw';

async function createStorageBuckets() {
  console.log('🔧 Fixing storage buckets...');
  
  try {
    // First, let's try to create the buckets using the REST API
    const headers = {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY
    };

    // Create posts bucket
    console.log('📦 Creating posts bucket...');
    const postsResponse = await fetch(`${SUPABASE_URL}/rest/v1/storage/buckets`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        id: 'posts',
        name: 'posts',
        public: true,
        file_size_limit: 10485760,
        allowed_mime_types: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm']
      })
    });

    if (postsResponse.ok) {
      console.log('✅ Posts bucket created successfully!');
    } else {
      const error = await postsResponse.text();
      console.log('⚠️ Posts bucket creation response:', postsResponse.status, error);
    }

    // Create profiles bucket
    console.log('📦 Creating profiles bucket...');
    const profilesResponse = await fetch(`${SUPABASE_URL}/rest/v1/storage/buckets`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        id: 'profiles',
        name: 'profiles',
        public: true,
        file_size_limit: 5242880,
        allowed_mime_types: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
      })
    });

    if (profilesResponse.ok) {
      console.log('✅ Profiles bucket created successfully!');
    } else {
      const error = await profilesResponse.text();
      console.log('⚠️ Profiles bucket creation response:', profilesResponse.status, error);
    }

    // Now let's create the storage policies using SQL
    console.log('🔐 Creating storage policies...');
    const policiesSQL = `
      -- Create storage policies for posts bucket
      CREATE POLICY IF NOT EXISTS "Users can upload post media"
        ON storage.objects
        FOR INSERT
        TO authenticated
        WITH CHECK (bucket_id = 'posts' AND auth.uid()::text = (storage.foldername(name))[1]);

      CREATE POLICY IF NOT EXISTS "Post media is publicly viewable"
        ON storage.objects
        FOR SELECT
        TO public
        USING (bucket_id = 'posts');

      CREATE POLICY IF NOT EXISTS "Users can update their own post media"
        ON storage.objects
        FOR UPDATE
        TO authenticated
        USING (bucket_id = 'posts' AND auth.uid()::text = (storage.foldername(name))[1]);

      CREATE POLICY IF NOT EXISTS "Users can delete their own post media"
        ON storage.objects
        FOR DELETE
        TO authenticated
        USING (bucket_id = 'posts' AND auth.uid()::text = (storage.foldername(name))[1]);

      -- Create storage policies for profiles bucket
      CREATE POLICY IF NOT EXISTS "Users can upload their own profile photos"
        ON storage.objects
        FOR INSERT
        TO authenticated
        WITH CHECK (bucket_id = 'profiles' AND auth.uid()::text = (storage.foldername(name))[1]);

      CREATE POLICY IF NOT EXISTS "Profile photos are publicly viewable"
        ON storage.objects
        FOR SELECT
        TO public
        USING (bucket_id = 'profiles');

      CREATE POLICY IF NOT EXISTS "Users can update their own profile photos"
        ON storage.objects
        FOR UPDATE
        TO authenticated
        USING (bucket_id = 'profiles' AND auth.uid()::text = (storage.foldername(name))[1]);

      CREATE POLICY IF NOT EXISTS "Users can delete their own profile photos"
        ON storage.objects
        FOR DELETE
        TO authenticated
        USING (bucket_id = 'profiles' AND auth.uid()::text = (storage.foldername(name))[1]);
    `;

    const sqlResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        sql: policiesSQL
      })
    });

    if (sqlResponse.ok) {
      console.log('✅ Storage policies created successfully!');
    } else {
      console.log('⚠️ Policy creation response:', sqlResponse.status);
    }

    console.log('\n🎉 Storage setup completed!');
    console.log('\n📋 Next steps:');
    console.log('1. Try uploading an image in your app');
    console.log('2. If it still doesn\'t work, run: node test-storage.js');
    console.log('3. Check the browser console for any errors');

  } catch (error) {
    console.error('❌ Error fixing storage:', error);
    console.log('\n💡 Alternative solution:');
    console.log('1. Go to https://supabase.com/dashboard');
    console.log('2. Select your project');
    console.log('3. Go to SQL Editor');
    console.log('4. Run the create-storage-buckets.sql script');
  }
}

createStorageBuckets();

