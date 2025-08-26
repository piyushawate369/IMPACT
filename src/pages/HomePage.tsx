import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { MessageCircle, Trash2, Filter, Plus, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

// Utility function to test image URL
const testImageUrl = async (url: string): Promise<boolean> => {
  try {
    const response = await fetch(url, { method: 'HEAD' })
    const contentType = response.headers.get('content-type')
    return response.ok && !!contentType && contentType.startsWith('image/')
  } catch (error) {
    console.error('Image URL test failed:', error)
    return false
  }
}

// Build a displayable public URL from either a full URL or a storage path
const buildPublicUrl = (pathOrUrl: string | null | undefined): string => {
  if (!pathOrUrl) return ''
  try {
    const trimmed = pathOrUrl.trim()
    // If already absolute HTTP(S) URL, return as is
    if (/^https?:\/\//i.test(trimmed)) return trimmed

    // If it's a storage path (e.g., posts/user/file.png), prefix Supabase public object URL
    const baseUrl = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, '') || ''
    const objectPath = trimmed.replace(/^\/*/, '') // remove leading slashes
    if (baseUrl) {
      return `${baseUrl}/storage/v1/object/public/${objectPath}`
    }
    return trimmed
  } catch {
    return pathOrUrl || ''
  }
}



interface Post {
  id: string;
  user_id: string;
  caption: string;
  media_url: string | null;
  media_type: string | null;
  category: string;
  points_awarded: number;
  created_at: string;
  users: {
    username: string;
    full_name: string;
    profile_photo: string | null;
  };
  post_likes: { id: string; user_id: string }[];
  post_comments: {
    id: string;
    content: string;
    created_at: string;
    users: {
      username: string;
      full_name: string;
    };
  }[];
}

const categories = [
  'all',
  'recycling',
  'energy',
  'transportation',
  'water',
  'waste',
  'other'
];

export default function HomePage() {
  const { userProfile } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [newComment, setNewComment] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    fetchPosts();
  }, [selectedCategory]);

  // Test existing image URLs and clean up corrupted ones
  useEffect(() => {
    const testExistingImages = async () => {
      if (posts.length > 0) {
        for (const post of posts) {
          if (post.media_url && post.media_type === 'image') {
            console.log('Testing existing image:', post.media_url);
            const isValid = await testImageUrl(post.media_url);
            console.log('Image valid:', isValid, 'for URL:', post.media_url);
            
            // If image is corrupted and user owns the post, offer to clean it up
            if (!isValid && userProfile?.id === post.user_id) {
              console.warn('Corrupted image detected for user-owned post:', post.id);
              // Don't auto-delete, let user decide via UI
            }
          }
        }
      }
    };

    if (posts.length > 0) {
      testExistingImages();
    }
  }, [posts, userProfile]);

  const fetchPosts = async () => {
    try {
      if (!isSupabaseConfigured) {
        setPosts([])
        setLoading(false)
        return
      }

      let query = supabase
        .from('posts')
        .select(`
          *,
          users (username, full_name, profile_photo),
          post_likes (id, user_id),
          post_comments (
            id,
            content,
            created_at,
            users (username, full_name)
          )
        `)
        .order('created_at', { ascending: false });

      if (selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      console.log('Fetched posts:', data)
      // Log posts with media
      const postsWithMedia = data?.filter(post => post.media_url)
      console.log('Posts with media:', postsWithMedia)
      
      setPosts(data || []);
    } catch (error) {
      console.error('Network error fetching posts:', error);
      console.error('Please check your internet connection and Supabase configuration');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId: string) => {
    if (!userProfile) return;

    try {
      const existingLike = posts
        .find(p => p.id === postId)
        ?.post_likes.find(like => like.user_id === userProfile.id);

      if (existingLike) {
        // Unlike
        await supabase
          .from('post_likes')
          .delete()
          .eq('id', existingLike.id);
      } else {
        // Like
        await supabase
          .from('post_likes')
          .insert({
            post_id: postId,
            user_id: userProfile.id
          });
      }

      fetchPosts();
    } catch (error) {
      console.error('Error handling like:', error);
    }
  };

  const handleComment = async (postId: string) => {
    if (!userProfile || !newComment[postId]?.trim()) return;

    try {
      await supabase
        .from('post_comments')
        .insert({
          post_id: postId,
          user_id: userProfile.id,
          content: newComment[postId].trim()
        });

      setNewComment(prev => ({ ...prev, [postId]: '' }));
      fetchPosts();
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!userProfile) return;

    if (!confirm('Are you sure you want to delete this post? You will lose 10 points.')) return;
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
        });

      await supabase
        .from('posts')
        .delete()
        .eq('id', postId)
        .eq('user_id', userProfile.id);

      fetchPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="animate-pulse space-y-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow p-6">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-32 bg-gray-200 rounded mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Community Feed</h1>
        <Link
          to="/create"
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Post
        </Link>
      </div>

      {/* Category Filter */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filter by category:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Posts */}
      <div className="space-y-6">
        {posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No posts found.</p>
            <Link
              to="/create"
              className="text-green-600 hover:text-green-700 font-medium"
            >
              Be the first to share your environmental impact!
            </Link>
          </div>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              {/* Post Header */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      {post.users.profile_photo ? (
                        <img
                          src={post.users.profile_photo}
                          alt={post.users.full_name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-green-600 font-semibold">
                          {post.users.full_name.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{post.users.full_name}</p>
                      <p className="text-sm text-gray-500">@{post.users.username}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                      {post.category}
                    </span>
                    <span className="text-sm text-gray-500">
                      +{post.points_awarded} pts
                    </span>
                    {userProfile?.id === post.user_id && (
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Post Content */}
              <div className="p-4">
                <p className="text-gray-800 mb-4">{post.caption}</p>
                
                {post.media_url && (() => {
                  console.log('=== IMAGE DISPLAY DEBUG ===');
                  const displayUrl = buildPublicUrl(post.media_url)
                  console.log('Post ID:', post.id);
                  console.log('Raw Media URL:', post.media_url);
                  console.log('Display Media URL:', displayUrl);
                  console.log('Media Type:', post.media_type);
                  console.log('Full post object:', post);
                  return (
                    <div className="mb-4">
                      {post.media_type === 'image' ? (
                        <div className="relative">
                          <img
                            src={displayUrl}
                            alt="Post media"
                            className="w-full h-64 object-cover rounded-lg"
                            onError={(e) => {
                              console.error('=== IMAGE LOAD ERROR ===');
                              console.error('Failed to load image:', displayUrl);
                              console.error('Image element:', e.currentTarget);
                              console.error('Post data:', post);
                              console.error('Error event:', e);
                              
                              // Try to reload the image with a cache-busting parameter
                              const img = e.currentTarget as HTMLImageElement;
                              const originalSrc = img.src;
                              const newSrc = originalSrc.includes('?') 
                                ? `${originalSrc}&t=${Date.now()}` 
                                : `${originalSrc}?t=${Date.now()}`;
                              
                              console.log('Retrying with cache-busting URL:', newSrc);
                              img.src = newSrc;
                              
                              // If it still fails after retry, show fallback
                              img.onerror = () => {
                                console.error('Image retry also failed');
                                img.style.display = 'none';
                                const fallback = img.parentElement?.querySelector('.image-fallback');
                                if (fallback) {
                                  (fallback as HTMLElement).style.display = 'flex';
                                }
                              };
                            }}
                            onLoad={() => {
                              console.log('=== IMAGE LOAD SUCCESS ===');
                              console.log('Image loaded successfully:', displayUrl);
                              console.log('Image element:', event?.target);
                            }}
                          />
                          <div className="image-fallback hidden absolute inset-0 bg-gray-100 rounded-lg flex items-center justify-center">
                            <div className="text-center">
                              <div className="text-gray-400 text-4xl mb-2">📷</div>
                              <p className="text-gray-500 text-sm">Image not available</p>
                              <p className="text-gray-400 text-xs mt-1">URL: {displayUrl}</p>
                              <div className="flex gap-2 justify-center mt-2">
                                <button 
                                  onClick={() => {
                                    console.log('Testing image URL:', displayUrl);
                                    window.open(displayUrl || '', '_blank');
                                  }}
                                  className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                                >
                                  Test URL
                                </button>
                                <button 
                                  onClick={async () => {
                                    if (displayUrl) {
                                      console.log('Retrying image load for:', displayUrl);
                                      const isValid = await testImageUrl(displayUrl);
                                      console.log('Image URL valid:', isValid);
                                      if (isValid) {
                                        // Force re-render by updating the image src
                                        const imgElement = document.querySelector(`img[src="${displayUrl}"]`) as HTMLImageElement;
                                        if (imgElement) {
                                          imgElement.style.display = 'block';
                                          imgElement.src = displayUrl + '?t=' + Date.now();
                                        }
                                      }
                                    }
                                  }}
                                  className="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                                >
                                  <RefreshCw className="w-3 h-3 inline mr-1" />
                                  Retry
                                </button>

                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <video
                          src={displayUrl}
                          controls
                          className="w-full h-64 rounded-lg"
                          onError={(e) => {
                            console.error('Failed to load video:', displayUrl);
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      )}
                    </div>
                  );
                })()}

                {/* Post Actions */}
                <div className="flex items-center space-x-4 mb-4">
                  <button
                    onClick={() => handleLike(post.id)}
                    className={`flex items-center space-x-1 ${
                      post.post_likes.some(like => like.user_id === userProfile?.id)
                        ? 'text-red-500'
                        : 'text-gray-500 hover:text-red-500'
                    }`}
                  >
                    <span className="text-lg">🌱</span>
                    <span>{post.post_likes.length}</span>
                  </button>
                  <div className="flex items-center space-x-1 text-gray-500">
                    <MessageCircle className="w-5 h-5" />
                    <span>{post.post_comments.length}</span>
                  </div>
                </div>

                {/* Comments */}
                {post.post_comments.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {post.post_comments.map((comment) => (
                      <div key={comment.id} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-semibold text-sm text-gray-900">
                            {comment.users.full_name}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(comment.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-gray-800 text-sm">{comment.content}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Comment */}
                {userProfile && (
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="Add a comment..."
                      value={newComment[post.id] || ''}
                      onChange={(e) => setNewComment(prev => ({
                        ...prev,
                        [post.id]: e.target.value
                      }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleComment(post.id);
                        }
                      }}
                    />
                    <button
                      onClick={() => handleComment(post.id)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Post
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}