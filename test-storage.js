// Test script to verify storage bucket setup
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://vclgqaermjxdnchifmli.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjbGdxYWVybWp4ZG5jaGlmbWxpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0MzM5OTQsImV4cCI6MjA2OTAwOTk5NH0.SN-rOT_Gz-QIlN6uB0jnbDxUmLBsP34Oqr-i4hfpwiw'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testStorage() {
  console.log('Testing Supabase storage setup...')
  
  try {
    // 1. Check if buckets exist
    console.log('\n1. Checking storage buckets...')
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    
    if (bucketsError) {
      console.error('❌ Error listing buckets:', bucketsError)
      return
    }
    
    console.log('✅ Buckets found:', buckets?.map(b => b.name))
    
    const postsBucket = buckets?.find(bucket => bucket.name === 'posts')
    const profilesBucket = buckets?.find(bucket => bucket.name === 'profiles')
    
    if (!postsBucket) {
      console.error('❌ Posts bucket not found!')
      console.log('💡 You need to run the SQL migration to create the storage buckets.')
      console.log('💡 Go to your Supabase dashboard > SQL Editor and run the fix-storage.sql script.')
      return
    }
    
    if (!profilesBucket) {
      console.error('❌ Profiles bucket not found!')
      console.log('💡 You need to run the SQL migration to create the storage buckets.')
      return
    }
    
    console.log('✅ Posts bucket:', postsBucket)
    console.log('✅ Profiles bucket:', profilesBucket)
    
    // 2. Test listing files in posts bucket
    console.log('\n2. Testing posts bucket access...')
    const { data: files, error: filesError } = await supabase.storage
      .from('posts')
      .list()
    
    if (filesError) {
      console.error('❌ Error listing files in posts bucket:', filesError)
      return
    }
    
    console.log('✅ Files in posts bucket:', files)
    
    // 3. Test bucket configuration
    console.log('\n3. Testing bucket configuration...')
    console.log('Posts bucket public:', postsBucket.public)
    console.log('Posts bucket file size limit:', postsBucket.file_size_limit)
    console.log('Posts bucket allowed mime types:', postsBucket.allowed_mime_types)
    
    if (!postsBucket.public) {
      console.error('❌ Posts bucket is not public!')
      console.log('💡 The bucket needs to be public for images to be viewable.')
    } else {
      console.log('✅ Posts bucket is public')
    }
    
    console.log('\n🎉 Storage setup test completed!')
    console.log('\nIf you see any ❌ errors above, you need to:')
    console.log('1. Go to your Supabase dashboard')
    console.log('2. Navigate to SQL Editor')
    console.log('3. Run the fix-storage.sql script')
    console.log('4. Or run the migration: supabase/migrations/20250728000000_fix_storage_buckets.sql')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testStorage()

