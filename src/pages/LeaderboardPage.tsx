import React, { useState, useEffect } from 'react'
import { Trophy, Medal, Award, Crown } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface LeaderboardUser {
  id: string
  username: string
  full_name: string
  points: number
  profile_photo: string
}

export default function LeaderboardPage() {
  const [users, setUsers] = useState<LeaderboardUser[]>([])
  const [loading, setLoading] = useState(true)
  const [timeFrame, setTimeFrame] = useState('all-time')

  useEffect(() => {
    fetchLeaderboard()
  }, [timeFrame])

  const fetchLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, username, full_name, points, profile_photo')
        .order('points', { ascending: false })
        .limit(50)

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error('Error fetching leaderboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-500" />
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />
      default:
        return <div className="w-6 h-6 flex items-center justify-center text-gray-500 font-bold">#{rank}</div>
    }
  }

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white'
      case 2:
        return 'bg-gradient-to-r from-gray-300 to-gray-400 text-white'
      case 3:
        return 'bg-gradient-to-r from-amber-500 to-amber-600 text-white'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Trophy className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Leaderboard</h1>
        <p className="text-gray-600">Top environmental champions making a difference</p>
      </div>

      {/* Time Frame Filter */}
      <div className="flex justify-center mb-8">
        <div className="bg-white rounded-lg p-1 shadow-sm border border-gray-200">
          {['all-time', 'monthly', 'weekly'].map((frame) => (
            <button
              key={frame}
              onClick={() => setTimeFrame(frame)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                timeFrame === frame
                  ? 'bg-green-500 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {frame === 'all-time' ? 'All Time' : frame.charAt(0).toUpperCase() + frame.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Top 3 Podium */}
      {users.length >= 3 && (
        <div className="mb-8">
          <div className="flex items-end justify-center space-x-4 mb-8">
            {/* Second Place */}
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full flex items-center justify-center mb-3 mx-auto">
                <span className="text-white font-bold text-xl">
                  {users[1]?.username.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="bg-gray-100 rounded-lg p-4 w-32">
                <Medal className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                <p className="font-bold text-gray-900 text-sm truncate">{users[1]?.full_name}</p>
                <p className="text-xs text-gray-600">@{users[1]?.username}</p>
                <p className="text-lg font-bold text-gray-700 mt-1">{users[1]?.points}</p>
              </div>
            </div>

            {/* First Place */}
            <div className="text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center mb-3 mx-auto relative">
                <Crown className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-6 h-6 text-yellow-600" />
                <span className="text-white font-bold text-2xl">
                  {users[0]?.username.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 w-36">
                <Trophy className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
                <p className="font-bold text-gray-900 text-sm truncate">{users[0]?.full_name}</p>
                <p className="text-xs text-gray-600">@{users[0]?.username}</p>
                <p className="text-xl font-bold text-yellow-600 mt-1">{users[0]?.points}</p>
              </div>
            </div>

            {/* Third Place */}
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full flex items-center justify-center mb-3 mx-auto">
                <span className="text-white font-bold text-xl">
                  {users[2]?.username.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="bg-amber-50 rounded-lg p-4 w-32">
                <Award className="w-6 h-6 text-amber-600 mx-auto mb-2" />
                <p className="font-bold text-gray-900 text-sm truncate">{users[2]?.full_name}</p>
                <p className="text-xs text-gray-600">@{users[2]?.username}</p>
                <p className="text-lg font-bold text-amber-600 mt-1">{users[2]?.points}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full Leaderboard */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Full Rankings</h2>
        </div>
        
        <div className="divide-y divide-gray-100">
          {users.map((user, index) => {
            const rank = index + 1
            return (
              <div key={user.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-4">
                  {/* Rank */}
                  <div className="flex-shrink-0">
                    {getRankIcon(rank)}
                  </div>

                  {/* Avatar */}
                  <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium">
                      {user.username.charAt(0).toUpperCase()}
                    </span>
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user.full_name}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      @{user.username}
                    </p>
                  </div>

                  {/* Points */}
                  <div className="flex-shrink-0">
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${getRankBadge(rank)}`}>
                      {user.points} pts
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {users.length === 0 && (
          <div className="text-center py-12">
            <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No users found</p>
            <p className="text-sm text-gray-400 mt-1">Be the first to start earning points!</p>
          </div>
        )}
      </div>
    </div>
  )
}