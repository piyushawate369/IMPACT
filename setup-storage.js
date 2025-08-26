// Script to set up storage buckets in Supabase
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://vclgqaermjxdnchifmli.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjbGdxYWVybWp4ZG5jaGlmbWxpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0MzM5OTQsImV4cCI6MjA2OTAwOTk5NH0.SN-rOT_Gz-QIlN6uB0jnbDxUmLBsP34Oqr-i4hfpwiw'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function setupStorage() {
  console.log('Setting up Supabase storage buckets...')
  
  try {
    // First, let's check what buckets exist
    const { data: existingBuckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      console.error('Error listing buckets:', listError)
      return
    }
    
    console.log('Existing buckets:', existingBuckets)
    
    // Check if posts bucket exists
    const postsBucketExists = existingBuckets?.some(bucket => bucket.name === 'posts')
    const profilesBucketExists = existingBuckets?.some(bucket => bucket.name === 'profiles')
    
    if (!postsBucketExists) {
      console.log('Creating posts bucket...')
      const { data: postsBucket, error: postsError } = await supabase.storage.createBucket('posts', {
        public: true,
        allowedMimeTypes: ['image/*', 'video/*'],
        fileSizeLimit: 10485760 // 10MB
      })
      
      if (postsError) {
        console.error('Error creating posts bucket:', postsError)
      } else {
        console.log('Posts bucket created successfully:', postsBucket)
      }
    } else {
      console.log('Posts bucket already exists')
    }
    
    if (!profilesBucketExists) {
      console.log('Creating profiles bucket...')
      const { data: profilesBucket, error: profilesError } = await supabase.storage.createBucket('profiles', {
        public: true,
        allowedMimeTypes: ['image/*'],
        fileSizeLimit: 5242880 // 5MB
      })
      
      if (profilesError) {
        console.error('Error creating profiles bucket:', profilesError)
      } else {
        console.log('Profiles bucket created successfully:', profilesBucket)
      }
    } else {
      console.log('Profiles bucket already exists')
    }
    
    // Verify buckets were created
    const { data: finalBuckets, error: finalError } = await supabase.storage.listBuckets()
    
    if (finalError) {
      console.error('Error listing final buckets:', finalError)
    } else {
      console.log('Final bucket list:', finalBuckets)
    }
    
  } catch (error) {
    console.error('Setup failed:', error)
  }
}

setupStorage()

