import React, { useState, useEffect } from 'react'
import { Edit3, Calendar, Award, Trash2, Upload, MoreVertical, RefreshCw } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

interface UserPost {
  id: string
  caption: string
  media_url: string
  category: string
  created_at: string
}

export default function ProfilePage() {
  const { userProfile, updateProfile, deleteAccount, resetApp } = useAuth()
  const [posts, setPosts] = useState<UserPost[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [editForm, setEditForm] = useState({
    full_name: '',
    bio: '',
    username: ''
  })

  useEffect(() => {
    if (userProfile) {
      setEditForm({
        full_name: userProfile.full_name || '',
        bio: userProfile.bio || '',
        username: userProfile.username || ''
      })
      fetchUserPosts()
    }
  }, [userProfile])

  const fetchUserPosts = async () => {
    if (!userProfile) return

    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', userProfile.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setPosts(data || [])
    } catch (error) {
      console.error('Error fetching user posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    try {
      await updateProfile(editForm)
      setEditing(false)
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Failed to update profile')
    }
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !userProfile) return

    setUploadingPhoto(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${userProfile.id}/avatar.${fileExt}`
      
      const { data, error } = await supabase.storage
        .from('profiles')
        .upload(fileName, file, { upsert: true })

      if (error) throw error

      const { data: urlData } = supabase.storage
        .from('profiles')
        .getPublicUrl(fileName)

      await updateProfile({ profile_photo: urlData.publicUrl })
    } catch (error) {
      console.error('Error uploading photo:', error)
      alert('Failed to upload photo')
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return

    if (!userProfile) return

    try {
      // Create a negative action to subtract points
      await supabase
        .from('actions')
        .insert({
          user_id: userProfile.id,
          action_type: 'post_deleted',
          description: 'Post deleted',
          points: -10,
          post_id: postId
        })

      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)

      if (error) throw error
      setPosts(posts.filter(p => p.id !== postId))
    } catch (error) {
      console.error('Error deleting post:', error)
      alert('Failed to delete post')
    }
  }

  const handleDeleteAccount = async () => {
    const confirmation = prompt('Type "DELETE" to confirm account deletion:')
    if (confirmation !== 'DELETE') return

    try {
      await deleteAccount()
      alert('Account deleted successfully')
    } catch (error) {
      console.error('Error deleting account:', error)
      alert('Failed to delete account')
    }
  }

  const handleResetApp = async () => {
    const confirmation = prompt('Type "RESET" to confirm app reset (this will delete ALL data):')
    if (confirmation !== 'RESET') return

    try {
      await resetApp()
    } catch (error) {
      console.error('Error resetting app:', error)
      alert('Failed to reset app')
    }
  }
  if (!userProfile) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your profile...</p>
          </div>
        </div>
      </div>
    )
  }

  const memberSince = new Date(userProfile.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long'
  })

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Admin Controls
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold text-red-800 mb-2">Admin Controls</h3>
        <div className="flex space-x-4">
          <button
            onClick={handleResetApp}
            className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reset App</span>
          </button>
        </div>
      </div> */}

      {/* Profile Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        <div className="h-32 bg-gradient-to-r from-green-400 to-emerald-500"></div>
        <div className="px-6 pb-6">
          <div className="flex items-end justify-between -mt-16 mb-4">
            <div className="relative">
              <div className="w-24 h-24 bg-white rounded-full p-1 shadow-lg">
                {userProfile.profile_photo ? (
                  <img
                    src={userProfile.profile_photo}
                    alt="Profile"
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-2xl">
                      {userProfile.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <label className="absolute bottom-0 right-0 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-green-600 transition-colors">
                <Upload className="w-4 h-4 text-white" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  disabled={uploadingPhoto}
                />
              </label>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setEditing(!editing)}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Edit3 className="w-4 h-4" />
                <span>{editing ? 'Cancel' : 'Edit Profile'}</span>
              </button>
              {/* <button
                onClick={handleDeleteAccount}
                className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Account</span>
              </button> */}
            </div>
          </div>

          {editing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={editForm.full_name}
                  onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input
                  type="text"
                  value={editForm.username}
                  onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                <textarea
                  value={editForm.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Tell us about your environmental journey..."
                />
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleSaveProfile}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">{userProfile.full_name}</h1>
              <p className="text-gray-600 mb-3">@{userProfile.username}</p>
              {userProfile.bio && (
                <p className="text-gray-700 mb-4">{userProfile.bio}</p>
              )}
              
              <div className="flex items-center space-x-6 text-sm text-gray-600 mb-4">
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>Joined {memberSince}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Award className="w-4 h-4" />
                  <span>{userProfile.points} points</span>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{posts.length}</div>
                  <div className="text-sm text-gray-600">Posts</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{userProfile.points}</div>
                  <div className="text-sm text-gray-600">Points</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {Math.floor(userProfile.points / 100)}
                  </div>
                  <div className="text-sm text-gray-600">Level</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* User Posts */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">My Posts</h2>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No posts yet</p>
            <p className="text-sm text-gray-400 mt-1">Share your first environmental impact!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
            {posts.map((post) => (
              <div key={post.id} className="group relative">
                <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                  {post.media_url ? (
                    <img
                      src={post.media_url}
                      alt={post.caption}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      onError={(e) => {
                        console.error('Failed to load image in profile:', post.media_url);
                        e.currentTarget.style.display = 'none';
                        // Show fallback
                        const fallback = e.currentTarget.parentElement?.querySelector('.image-fallback');
                        if (fallback) {
                          (fallback as HTMLElement).style.display = 'flex';
                        }
                      }}
                    />
                  ) : null}
                  <div className={`image-fallback ${post.media_url ? 'hidden' : 'flex'} w-full h-full items-center justify-center`}>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <Award className="w-6 h-6 text-green-600" />
                      </div>
                      <p className="text-sm text-gray-600 font-medium">{post.category}</p>
                      {post.media_url && (
                        <p className="text-xs text-gray-400 mt-1">Image unavailable</p>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleDeletePost(post.id)}
                  className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="mt-2">
                  <p className="text-sm text-gray-900 line-clamp-2">{post.caption}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(post.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}