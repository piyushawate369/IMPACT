// Test script to verify Supabase storage functionality
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://vclgqaermjxdnchifmli.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjbGdxYWVybWp4ZG5jaGlmbWxpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0MzM5OTQsImV4cCI6MjA2OTAwOTk5NH0.SN-rOT_Gz-QIlN6uB0jnbDxUmLBsP34Oqr-i4hfpwiw'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testStorage() {
  console.log('Testing Supabase storage...')
  
  try {
    // Test bucket listing
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    
    if (bucketsError) {
      console.error('Error listing buckets:', bucketsError)
      return
    }
    
    console.log('Available buckets:', buckets)
    
    // Check if posts bucket exists
    const postsBucket = buckets?.find(bucket => bucket.name === 'posts')
    if (postsBucket) {
      console.log('Posts bucket found:', postsBucket)
      console.log('Posts bucket public:', postsBucket.public)
      
      // List files in posts bucket
      const { data: files, error: filesError } = await supabase.storage
        .from('posts')
        .list()
      
      if (filesError) {
        console.error('Error listing files:', filesError)
      } else {
        console.log('Files in posts bucket:', files)
      }
    } else {
      console.error('Posts bucket not found!')
    }
    
  } catch (error) {
    console.error('Test failed:', error)
  }
}

testStorage()

