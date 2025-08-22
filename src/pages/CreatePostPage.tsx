import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, Upload, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
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
    if (file) {
      setMediaFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setMediaPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeMedia = () => {
    setMediaFile(null)
    setMediaPreview(null)
  }

  const uploadMedia = async (file: File) => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${userProfile.id}/post_${Date.now()}.${fileExt}`
    
    const { data, error } = await supabase.storage
      .from('posts')
      .upload(fileName, file)

    if (error) throw error

    const { data: urlData } = supabase.storage
      .from('posts')
      .getPublicUrl(fileName)

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
        mediaUrl = await uploadMedia(mediaFile)
        mediaType = mediaFile.type.startsWith('video/') ? 'video' : 'image'
      }

      // Create post
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

      if (postError) throw postError

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
      alert('Failed to create post. Please try again.')
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