import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Check if we have valid Supabase configuration
const hasValidConfig = supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'https://placeholder.supabase.co' &&
  !supabaseUrl.includes('your_supabase_url_here')

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDk3NzEyMDAsImV4cCI6MTk2NTM0NzIwMH0.placeholder',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    global: {
      headers: {
        'Content-Type': 'application/json',
      },
    },
  }
)

// Export configuration status for components to check
export const isSupabaseConfigured = hasValidConfig

// Debug function to test Supabase configuration
export const debugSupabaseConfig = () => {
  console.log('=== Supabase Configuration Debug ===')
  console.log('Supabase URL:', supabaseUrl)
  console.log('Supabase Anon Key exists:', !!supabaseAnonKey)
  console.log('Has valid config:', hasValidConfig)
  console.log('Full URL:', supabaseUrl || 'https://placeholder.supabase.co')
  console.log('=====================================')
}

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          username: string
          full_name: string
          profile_photo: string
          bio: string
          points: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          username: string
          full_name?: string
          profile_photo?: string
          bio?: string
          points?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          username?: string
          full_name?: string
          profile_photo?: string
          bio?: string
          points?: number
          created_at?: string
          updated_at?: string
        }
      }
      posts: {
        Row: {
          id: string
          user_id: string
          caption: string
          media_url: string
          media_type: 'image' | 'video'
          category: string
          points_awarded: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          caption?: string
          media_url?: string
          media_type?: 'image' | 'video'
          category?: string
          points_awarded?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          caption?: string
          media_url?: string
          media_type?: 'image' | 'video'
          category?: string
          points_awarded?: number
          created_at?: string
        }
      }
      actions: {
        Row: {
          id: string
          user_id: string
          action_type: string
          description: string
          points: number
          post_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          action_type: string
          description?: string
          points?: number
          post_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          action_type?: string
          description?: string
          points?: number
          post_id?: string | null
          created_at?: string
        }
      }
      events: {
        Row: {
          id: string
          title: string
          description: string
          location: string
          event_date: string
          created_by: string
          max_participants: number
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string
          location?: string
          event_date: string
          created_by: string
          max_participants?: number
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          location?: string
          event_date?: string
          created_by?: string
          max_participants?: number
          created_at?: string
        }
      }
      event_participants: {
        Row: {
          id: string
          event_id: string
          user_id: string
          joined_at: string
        }
        Insert: {
          id?: string
          event_id: string
          user_id: string
          joined_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          user_id?: string
          joined_at?: string
        }
      }
      post_likes: {
        Row: {
          id: string
          post_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          user_id?: string
          created_at?: string
        }
      }
      post_comments: {
        Row: {
          id: string
          post_id: string
          user_id: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          user_id: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          user_id?: string
          content?: string
          created_at?: string
        }
      }
    }
  }
}