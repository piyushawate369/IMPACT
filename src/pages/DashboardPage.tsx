import React, { useState, useEffect } from 'react'
import { TrendingUp, Award, Calendar, Target, Leaf, Users } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

interface DashboardStats {
  totalPosts: number
  totalPoints: number
  recentActions: any[]
  upcomingEvents: any[]
  weeklyProgress: number
  level: number
  nextLevelPoints: number
}

export default function DashboardPage() {
  const { userProfile } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    totalPosts: 0,
    totalPoints: 0,
    recentActions: [],
    upcomingEvents: [],
    weeklyProgress: 0,
    level: 1,
    nextLevelPoints: 100
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (userProfile) {
      fetchDashboardData()
    }
  }, [userProfile])

  const fetchDashboardData = async () => {
    if (!userProfile) return

    try {
      // Fetch user's posts count
      const { count: postsCount } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userProfile.id)

      // Fetch recent actions
      const { data: actionsData } = await supabase
        .from('actions')
        .select('*')
        .eq('user_id', userProfile.id)
        .order('created_at', { ascending: false })
        .limit(5)

      // Fetch upcoming events user is participating in
      const { data: eventsData } = await supabase
        .from('event_participants')
        .select(`
          events (
            id,
            title,
            event_date,
            location
          )
        `)
        .eq('user_id', userProfile.id)

      // Calculate weekly progress (actions in last 7 days)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      
      const { count: weeklyActions } = await supabase
        .from('actions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userProfile.id)
        .gte('created_at', weekAgo.toISOString())

      // Calculate level and next level points
      const level = Math.floor(userProfile.points / 100) + 1
      const nextLevelPoints = level * 100

      setStats({
        totalPosts: postsCount || 0,
        totalPoints: userProfile.points,
        recentActions: actionsData || [],
        upcomingEvents: eventsData?.map(ep => ep.events).filter(Boolean) || [],
        weeklyProgress: weeklyActions || 0,
        level,
        nextLevelPoints
      })
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  const progressToNextLevel = ((userProfile?.points || 0) % 100) / 100 * 100

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {userProfile?.full_name}!
        </h1>
        <p className="text-gray-600">Here's your environmental impact summary</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Points */}
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <Award className="w-6 h-6" />
            </div>
            <span className="text-sm opacity-80">Total Points</span>
          </div>
          <div className="text-3xl font-bold mb-1">{stats.totalPoints}</div>
          <div className="text-sm opacity-80">Level {stats.level}</div>
        </div>

        {/* Posts Created */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Leaf className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-sm text-gray-500">Posts</span>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{stats.totalPosts}</div>
          <div className="text-sm text-gray-600">Environmental actions</div>
        </div>

        {/* Weekly Progress */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-sm text-gray-500">This Week</span>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{stats.weeklyProgress}</div>
          <div className="text-sm text-gray-600">Actions completed</div>
        </div>

        {/* Upcoming Events */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-orange-600" />
            </div>
            <span className="text-sm text-gray-500">Events</span>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{stats.upcomingEvents.length}</div>
          <div className="text-sm text-gray-600">Upcoming events</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Level Progress */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Level Progress</h2>
            <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
          
          <div className="text-center mb-6">
            <div className="text-4xl font-bold text-gray-900 mb-2">Level {stats.level}</div>
            <p className="text-gray-600">
              {stats.nextLevelPoints - (userProfile?.points || 0)} points to level {stats.level + 1}
            </p>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
            <div 
              className="bg-gradient-to-r from-green-500 to-emerald-600 h-4 rounded-full transition-all duration-500"
              style={{ width: `${progressToNextLevel}%` }}
            />
          </div>
          
          <div className="flex justify-between text-sm text-gray-600">
            <span>{(stats.level - 1) * 100}</span>
            <span>{userProfile?.points}</span>
            <span>{stats.nextLevelPoints}</span>
          </div>
        </div>

        {/* Recent Actions */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Recent Actions</h2>
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <Leaf className="w-5 h-5 text-green-600" />
            </div>
          </div>

          {stats.recentActions.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Leaf className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-gray-500">No recent actions</p>
              <p className="text-sm text-gray-400 mt-1">Start by creating your first post!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {stats.recentActions.map((action, index) => (
                <div key={action.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{action.description}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(action.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-sm font-medium text-green-600">
                    +{action.points} pts
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Events */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Upcoming Events</h2>
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
          </div>

          {stats.upcomingEvents.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-gray-500">No upcoming events</p>
              <p className="text-sm text-gray-400 mt-1">Check out the Events page to join community activities!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {stats.upcomingEvents.map((event) => (
                <div key={event.id} className="p-4 border border-gray-200 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">{event.title}</h3>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(event.event_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Users className="w-4 h-4" />
                      <span>{event.location}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}