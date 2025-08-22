import React, { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  userProfile: any | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<any>
  signUp: (email: string, password: string, username: string, fullName: string) => Promise<any>
  signOut: () => Promise<void>
  updateProfile: (updates: any) => Promise<void>
  deleteAccount: () => Promise<void>
  resetApp: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchUserProfile(session.user.id)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          fetchUserProfile(session.user.id)
        } else {
          setUserProfile(null)
          if (event === 'SIGNED_OUT' || !session?.user) {
            // Only redirect if we're not already on login/signup pages
            const currentPath = window.location.pathname
            if (currentPath !== '/login' && currentPath !== '/signup') {
              window.location.href = '/login'
            }
          }
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserProfile = async (userId: string) => {
    try {
      if (!isSupabaseConfigured) {
        setUserProfile(null)
        return
      }

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)

      if (error) {
        console.error('Error fetching user profile:', error)
        setUserProfile(null)
        return
      }

      if (data && data.length > 0) {
        setUserProfile(data[0])
      } else {
        // No profile found, this shouldn't happen but handle gracefully
        console.warn('No user profile found for user:', userId)
        setUserProfile(null)
      }
    } catch (error) {
      console.error('Network error fetching user profile:', error)
      console.error('Please check your internet connection and Supabase configuration')
      setUserProfile(null)
    }
  }

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    return { data, error }
  }

  const signUp = async (email: string, password: string, username: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          full_name: fullName,
        },
        emailRedirectTo: window.location.origin
      },
    })

    // If signup was successful, create the user profile
    if (data.user && !error) {
      try {
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email: data.user.email!,
            username,
            full_name: fullName,
            points: 0,
            bio: '',
            profile_photo: ''
          })

        if (profileError) {
          console.error('Error creating user profile:', profileError)
        }
      } catch (profileError) {
        console.error('Error creating user profile:', profileError)
      }
    }

    return { data, error }
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      // Clear any local state
      setUser(null)
      setUserProfile(null)
      // Force redirect to login
      window.location.href = '/login'
    } catch (error) {
      console.error('Error signing out:', error)
      // Even if there's an error, redirect to login
      window.location.href = '/login'
    }
  }

  const updateProfile = async (updates: any) => {
    if (!user) return

    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id)

    if (!error) {
      setUserProfile((prev: any) => ({ ...prev, ...updates }))
    }
  }

  const deleteAccount = async () => {
    if (!user) return

    try {
      // Delete user profile and all related data (cascading deletes will handle posts, comments, etc.)
      const { error: profileError } = await supabase
        .from('users')
        .delete()
        .eq('id', user.id)

      if (profileError) throw profileError

      // Delete auth user
      const { error: authError } = await supabase.auth.admin.deleteUser(user.id)
      if (authError) console.error('Error deleting auth user:', authError)

      // Sign out
      await supabase.auth.signOut()
    } catch (error) {
      console.error('Error deleting account:', error)
      throw error
    }
  }

  const resetApp = async () => {
    try {
      // Clear all data from all tables
      await supabase.from('post_comments').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      await supabase.from('post_likes').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      await supabase.from('event_participants').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      await supabase.from('events').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      await supabase.from('actions').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      await supabase.from('posts').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      await supabase.from('users').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      
      // Sign out current user
      await supabase.auth.signOut()
      
      // Clear local storage
      localStorage.clear()
      sessionStorage.clear()
      
      // Reload the page
      window.location.reload()
    } catch (error) {
      console.error('Error resetting app:', error)
      throw error
    }
  }
  const value = {
    user,
    userProfile,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    deleteAccount,
    resetApp,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}