import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Home, Plus, Trophy, Calendar, User, Leaf, LogOut, MoreVertical, UserX } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const { userProfile, signOut, loading } = useAuth()
  const [showDropdown, setShowDropdown] = React.useState(false)

  const handleLogout = async () => {
    setShowDropdown(false)
    await signOut()
  }

  const navigation = [
    { name: 'Home', href: '/home', icon: Home },
    { name: 'Leaderboard', href: '/leaderboard', icon: Trophy },
    { name: 'Events', href: '/events', icon: Calendar },
    { name: 'Profile', href: '/profile', icon: User },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/home" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">IMPACT For Sustainability </span>
            </Link>
            
            <div className="flex items-center space-x-4">
              {userProfile && (
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="font-medium">{userProfile.points} points</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">{userProfile.full_name}</span>
                  </div>
                  
                  {/* Three-dot menu */}
                  <div className="relative">
                    <button
                      onClick={() => setShowDropdown(!showDropdown)}
                      className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>
                    
                    {showDropdown && (
                      <>
                        {/* Backdrop to close dropdown */}
                        <div 
                          className="fixed inset-0 z-10" 
                          onClick={() => setShowDropdown(false)}
                        />
                        
                        {/* Dropdown menu */}
                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                          <div className="py-1">
                            <button
                              onClick={handleLogout}
                              className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                            >
                              <LogOut className="w-4 h-4" />
                              <span>Sign out</span>
                            </button>
                            {/* <button
                              onClick={handleLogout}
                              className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                            >
                              <UserX className="w-4 h-4" />
                              <span>Sign in with different account</span>
                            </button> */}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
              {!userProfile && !loading && (
                <div className="text-sm text-gray-500">
                  No profile
                </div>
              )}
              {loading && (
                <div className="text-sm text-gray-500">
                  Loading...
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pb-20">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-around py-2">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
                    isActive 
                      ? 'text-green-600 bg-green-50' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <item.icon className="w-6 h-6" />
                  <span className="text-xs mt-1 font-medium">{item.name}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </nav>
    </div>
  )
}