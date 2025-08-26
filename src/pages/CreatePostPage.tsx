import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, Upload, X } from 'lucide-react'
import { supabase, debugSupabaseConfig } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

const categories = [
  'Tree Planting',
  'Clean-Up',
  'Recycling',
  'Energy Saving',
  'Transportation',
  'Water Conservation',
  'Other'
]

export default function CreatePostPage() {
  const [caption, setCaption] = useState('')
  const [category, setCategory] = useState('Tree Planting')
  const [customCategory, setCustomCategory] = useState('')
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [mediaPreview, setMediaPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { user, userProfile } = useAuth()
  const navigate = useNavigate()

  // Test storage bucket configuration
  useEffect(() => {
    const testStorageBucket = async () => {
      try {
        debugSupabaseConfig()
        console.log('Testing Supabase configuration...')
        console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL)
        console.log('Supabase Anon Key exists:', !!import.meta.env.VITE_SUPABASE_ANON_KEY)
        
        // Test if we can access the storage bucket
        console.log('Testing storage bucket access...')
        const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
        
        if (bucketsError) {
          console.error('Error listing buckets:', bucketsError)
        } else {
          console.log('Available buckets:', buckets)
          const postsBucket = buckets?.find(bucket => bucket.name === 'posts')
          if (postsBucket) {
            console.log('Posts bucket found:', postsBucket)
            console.log('Posts bucket public:', postsBucket.public)
            
            // Test listing files in the posts bucket
            const { data: files, error: filesError } = await supabase.storage
              .from('posts')
              .list()
            
            if (filesError) {
              console.error('Error listing files in posts bucket:', filesError)
            } else {
              console.log('Files in posts bucket:', files)
            }
          } else {
            console.error('Posts bucket not found!')
          }
        }
      } catch (error) {
        console.error('Error testing storage:', error)
      }
    }

    testStorageBucket()
  }, [])

  // Show loading if user profile is not loaded yet
  if (!userProfile) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your profile...</p>
          </div>
        </div>
      </div>
    )
  }

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    console.log('=== FILE SELECTION DEBUG ===')
    console.log('Selected file:', file)
    
    if (file) {
      console.log('File details:', {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified
      })
      
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm']
      if (!allowedTypes.includes(file.type)) {
        alert(`Invalid file type: ${file.type}. Please select an image or video file.`)
        return
      }
      
      // Validate file size
      const maxSize = 10 * 1024 * 1024 // 10MB
      if (file.size > maxSize) {
        alert('File too large. Please select a file smaller than 10MB.')
        return
      }
      
      setMediaFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        console.log('File preview generated successfully')
        setMediaPreview(e.target?.result as string)
      }
      reader.onerror = (e) => {
        console.error('Error reading file:', e)
        alert('Error reading file. Please try again.')
      }
      reader.readAsDataURL(file)
    } else {
      console.log('No file selected')
    }
  }

  const removeMedia = () => {
    setMediaFile(null)
    setMediaPreview(null)
  }

  const uploadMedia = async (file: File) => {
    console.log('=== UPLOAD DEBUG START ===')
    console.log('File object:', file)
    console.log('File name:', file.name)
    console.log('File size:', file.size)
    console.log('File type:', file.type)
    console.log('File lastModified:', file.lastModified)
    
    // Basic validation
    if (!file || file.size === 0) {
      throw new Error('Invalid file: file is empty or null')
    }

    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      throw new Error('File too large: maximum size is 10MB')
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm']
    if (!allowedTypes.includes(file.type)) {
      throw new Error(`Invalid file type: ${file.type}. Allowed types: ${allowedTypes.join(', ')}`)
    }

    // Ensure we have a valid file extension
    const fileExt = file.name.split('.').pop()?.toLowerCase()
    if (!fileExt || !['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'webm'].includes(fileExt)) {
      throw new Error(`Invalid file extension: ${fileExt}`)
    }

    // Sanitize filename (avoid spaces and special chars)
    const safeBaseName = `post_${Date.now()}`
    const fileName = `${userProfile.id}/${safeBaseName}.${fileExt}`
    
    console.log('Generated fileName:', fileName)
    console.log('User profile ID:', userProfile.id)
    
    // Proceed to upload directly; if storage isn't configured, upload will return a clear error
    console.log('Proceeding to upload without explicit bucket pre-check')
    
    // Upload raw bytes (ArrayBuffer) to avoid multipart wrapper corruption
    console.log('Starting upload to Supabase (ArrayBuffer)...')
    const fileBuffer = await file.arrayBuffer()
    const { data, error } = await supabase.storage
      .from('posts')
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false // Don't overwrite existing files
      })

    if (error) {
      console.error('Upload error:', error)
      
      // Provide more specific error messages
      if (error.message?.includes('row-level security')) {
        throw new Error('Storage access denied. Please try logging out and back in.')
      } else if (error.message?.includes('bucket')) {
        throw new Error('Storage not configured properly. Please contact support.')
      } else if (error.message?.includes('size')) {
        throw new Error('File is too large. Please select a smaller file.')
      } else {
        throw new Error(`Upload failed: ${error.message || 'Unknown error'}`)
      }
    }

    console.log('Upload successful, data:', data)

    // Get public URL
    console.log('Getting public URL...')
    const { data: urlData } = supabase.storage
      .from('posts')
      .getPublicUrl(fileName)

    console.log('Public URL data:', urlData)
    console.log('Public URL:', urlData.publicUrl)
    
    // Verify the URL is accessible
    console.log('Verifying URL accessibility...')
    try {
      const response = await fetch(urlData.publicUrl, { 
        method: 'HEAD',
        cache: 'no-cache' // Don't use cached version
      })
      console.log('URL verification response:', response)
      console.log('Response status:', response.status)
      console.log('Response headers:', Object.fromEntries(response.headers.entries()))
      
      if (!response.ok) {
        console.warn('Warning: Uploaded file may not be accessible:', response.status)
        // Don't throw error, just log warning
      } else {
        console.log('URL verification successful!')
      }
    } catch (testError) {
      console.error('URL verification failed:', testError)
      // Don't throw error, just log warning
    }
    
    console.log('=== UPLOAD DEBUG END ===')
    return urlData.publicUrl
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userProfile) return

    setLoading(true)

    try {
      let mediaUrl = ''
      let mediaType: 'image' | 'video' = 'image'

      if (mediaFile) {
        try {
          mediaUrl = await uploadMedia(mediaFile)
          mediaType = mediaFile.type.startsWith('video/') ? 'video' : 'image'
          
          // Validate the media URL
          if (!mediaUrl || !mediaUrl.startsWith('http')) {
            console.error('Invalid media URL generated:', mediaUrl)
            throw new Error('Failed to generate valid media URL')
          }
        } catch (uploadError) {
          console.error('Media upload failed:', uploadError)
          alert(`Media upload failed: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`)
          setLoading(false)
          return
        }
      }

      console.log('=== POST CREATION DEBUG ===')
      console.log('Creating post with data:', {
        user_id: userProfile.id,
        caption,
        category: category === 'Other' ? customCategory : category,
        media_url: mediaUrl,
        media_type: mediaType,
        points_awarded: 10
      })

      // Create post
      console.log('Inserting post into database...')
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .insert({
          user_id: userProfile.id,
          caption,
          category: category === 'Other' ? customCategory : category,
          media_url: mediaUrl,
          media_type: mediaType,
          points_awarded: 10
        })
        .select()
        .single()

      if (postError) {
        console.error('Post creation error:', postError)
        throw postError
      }

      console.log('Post created successfully:', postData)
      console.log('Post media_url in database:', postData.media_url)
      console.log('=== POST CREATION DEBUG END ===')

      // Create action for points
      const { error: actionError } = await supabase
        .from('actions')
        .insert({
          user_id: userProfile.id,
          action_type: 'post_created',
          description: `Posted about ${category === 'Other' ? customCategory.toLowerCase() : category.toLowerCase()}`,
          points: 10,
          post_id: postData.id
        })

      if (actionError) throw actionError

      navigate('/home')
    } catch (error) {
      console.error('Error creating post:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      alert(`Failed to create post: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Share Your Impact</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Caption */}
            <div>
              <label htmlFor="caption" className="block text-sm font-medium text-gray-700 mb-2">
                What did you do for the environment?
              </label>
              <textarea
                id="caption"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                placeholder="Share your environmental action and inspire others..."
                required
              />
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              {category === 'Other' && (
                <div className="mt-3">
                  <input
                    type="text"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="Please specify your category..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>
              )}
            </div>

            {/* Media Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Add Photo or Video (Optional)
              </label>
              
              {mediaPreview ? (
                <div className="relative">
                  {mediaFile?.type.startsWith('video/') ? (
                    <video
                      src={mediaPreview}
                      controls
                      className="w-full h-64 object-cover rounded-lg"
                    />
                  ) : (
                    <img
                      src={mediaPreview}
                      alt="Preview"
                      className="w-full h-64 object-cover rounded-lg"
                    />
                  )}
                  <button
                    type="button"
                    onClick={removeMedia}
                    className="absolute top-2 right-2 w-8 h-8 bg-black bg-opacity-50 text-white rounded-full flex items-center justify-center hover:bg-opacity-70"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">
                      <span className="font-medium">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-400">PNG, JPG, MP4 up to 10MB</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleMediaChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Points Info */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-green-800">
                  You'll earn 10 points for sharing this environmental action!
                </span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !caption.trim()}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 px-4 rounded-lg font-medium hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sharing...' : 'Share Your Impact'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}