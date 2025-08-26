// Direct fix using Supabase client
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://vclgqaermjxdnchifmli.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjbGdxYWVybWp4ZG5jaGlmbWxpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0MzM5OTQsImV4cCI6MjA2OTAwOTk5NH0.SN-rOT_Gz-QIlN6uB0jnbDxUmLBsP34Oqr-i4hfpwiw'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function fixStorageDirect() {
  console.log('🔧 Direct storage fix...')
  
  try {
    // First, let's check what buckets exist
    console.log('📋 Checking existing buckets...')
    const { data: existingBuckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      console.error('❌ Error listing buckets:', listError)
    } else {
      console.log('✅ Existing buckets:', existingBuckets?.map(b => b.name) || [])
    }
    
    // Try to create buckets using the storage API
    console.log('📦 Creating posts bucket...')
    const { data: postsBucket, error: postsError } = await supabase.storage.createBucket('posts', {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm'],
      fileSizeLimit: 10485760 // 10MB
    })
    
    if (postsError) {
      console.log('⚠️ Posts bucket error:', postsError.message)
    } else {
      console.log('✅ Posts bucket created:', postsBucket)
    }
    
    console.log('📦 Creating profiles bucket...')
    const { data: profilesBucket, error: profilesError } = await supabase.storage.createBucket('profiles', {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
      fileSizeLimit: 5242880 // 5MB
    })
    
    if (profilesError) {
      console.log('⚠️ Profiles bucket error:', profilesError.message)
    } else {
      console.log('✅ Profiles bucket created:', profilesBucket)
    }
    
    // Now let's try to create the policies using raw SQL
    console.log('🔐 Creating storage policies...')
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
    
    const { data: sqlResult, error: sqlError } = await supabase.rpc('exec_sql', {
      sql: policiesSQL
    })
    
    if (sqlError) {
      console.log('⚠️ SQL execution error:', sqlError.message)
    } else {
      console.log('✅ Storage policies created successfully!')
    }
    
    // Final check
    console.log('🔍 Final bucket check...')
    const { data: finalBuckets, error: finalError } = await supabase.storage.listBuckets()
    
    if (finalError) {
      console.error('❌ Final check error:', finalError)
    } else {
      console.log('✅ Final buckets:', finalBuckets?.map(b => b.name) || [])
      
      const postsExists = finalBuckets?.some(b => b.name === 'posts')
      const profilesExists = finalBuckets?.some(b => b.name === 'profiles')
      
      if (postsExists && profilesExists) {
        console.log('🎉 SUCCESS! Both storage buckets are now available!')
        console.log('📱 You can now upload images in your app!')
      } else {
        console.log('⚠️ Some buckets are still missing. Manual setup required.')
        console.log('💡 Go to Supabase dashboard > SQL Editor and run the create-storage-buckets.sql script')
      }
    }
    
  } catch (error) {
    console.error('❌ Error in direct fix:', error)
    console.log('\n💡 Manual setup required:')
    console.log('1. Go to https://supabase.com/dashboard')
    console.log('2. Select your project')
    console.log('3. Go to SQL Editor')
    console.log('4. Run the create-storage-buckets.sql script')
  }
}

fixStorageDirect()

