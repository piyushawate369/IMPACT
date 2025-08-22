import React, { useState, useEffect } from 'react'
import { Calendar, MapPin, Users, Plus, Clock, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

interface Event {
  id: string
  title: string
  description: string
  location: string
  event_date: string
  max_participants: number
  created_by: string
  created_at: string
  users: {
    username: string
    full_name: string
  }
  participant_count?: number
  is_participant?: boolean
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    location: '',
    event_date: '',
    max_participants: 50
  })
  const { user, userProfile } = useAuth()

  useEffect(() => {
    fetchEvents()
    
    // Set up interval to check for expired events every hour
    const interval = setInterval(() => {
      cleanupExpiredEvents()
    }, 60 * 60 * 1000) // Check every hour

    // Cleanup on component unmount
    return () => clearInterval(interval)
  }, [])

  const fetchEvents = async () => {
    try {
      // First, cleanup expired events
      await cleanupExpiredEvents()
      
      // Fetch events with creator info and participant count
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select(`
          *,
          users!events_created_by_fkey (
            username,
            full_name
          )
        `)
        .gte('event_date', new Date().toISOString())
        .order('event_date', { ascending: true })

      if (eventsError) throw eventsError

      // For each event, get participant count and check if current user is participating
      const eventsWithParticipants = await Promise.all(
        (eventsData || []).map(async (event) => {
          // Get participant count
          const { count } = await supabase
            .from('event_participants')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', event.id)

          // Check if current user is participating
          let isParticipant = false
          if (userProfile) {
            const { data: participantData } = await supabase
              .from('event_participants')
              .select('id')
              .eq('event_id', event.id)
              .eq('user_id', userProfile.id)
            
            isParticipant = participantData && participantData.length > 0
          }

          return {
            ...event,
            participant_count: count || 0,
            is_participant: isParticipant
          }
        })
      )

      setEvents(eventsWithParticipants)
    } catch (error) {
      console.error('Error fetching events:', error)
    } finally {
      setLoading(false)
    }
  }

  const cleanupExpiredEvents = async () => {
    try {
      // Calculate 24 hours ago
      const twentyFourHoursAgo = new Date()
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24)

      // Delete events that are more than 24 hours past their event_date
      const { error } = await supabase
        .from('events')
        .delete()
        .lt('event_date', twentyFourHoursAgo.toISOString())

      if (error) {
        console.error('Error cleaning up expired events:', error)
      }
    } catch (error) {
      console.error('Error in cleanup function:', error)
    }
  }

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userProfile) return

    try {
      const { error } = await supabase
        .from('events')
        .insert({
          ...newEvent,
          created_by: userProfile.id
        })

      if (error) throw error

      setShowCreateModal(false)
      setNewEvent({
        title: '',
        description: '',
        location: '',
        event_date: '',
        max_participants: 50
      })
      fetchEvents()
    } catch (error) {
      console.error('Error creating event:', error)
      alert('Failed to create event')
    }
  }

  const handleJoinEvent = async (eventId: string) => {
    if (!userProfile) return

    try {
      const { error } = await supabase
        .from('event_participants')
        .insert({
          event_id: eventId,
          user_id: userProfile.id
        })

      if (error) throw error
      fetchEvents()
    } catch (error) {
      console.error('Error joining event:', error)
      alert('Failed to join event')
    }
  }

  const handleLeaveEvent = async (eventId: string) => {
    if (!userProfile) return

    try {
      const { error } = await supabase
        .from('event_participants')
        .delete()
        .eq('event_id', eventId)
        .eq('user_id', userProfile.id)

      if (error) throw error
      fetchEvents()
    } catch (error) {
      console.error('Error leaving event:', error)
      alert('Failed to leave event')
    }
  }

  const handleDeleteEvent = async (eventId: string) => {
    if (!userProfile) return

    if (!confirm('Are you sure you want to delete this event?')) return

    try {
      // First delete all participants for this event
      const { error: participantsError } = await supabase
        .from('event_participants')
        .delete()
        .eq('event_id', eventId)

      if (participantsError) {
        console.error('Error deleting event participants:', participantsError)
        // Continue with event deletion even if participants deletion fails
      }

      // Then delete the event itself
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId)
        .eq('created_by', userProfile.id) // Ensure only creator can delete

      if (error) throw error
      
      // Remove the event from the local state immediately
      setEvents(prevEvents => prevEvents.filter(event => event.id !== eventId))
      
      console.log('Event deleted successfully from database')
    } catch (error) {
      console.error('Error deleting event:', error)
      alert('Failed to delete event')
      // Refresh events in case of error to ensure UI is in sync
      fetchEvents()
    }
  }

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
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
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Environmental Events</h1>
          <p className="text-gray-600">Join local events and make a collective impact</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Create Event</span>
        </button>
      </div>

      {/* Events List */}
      <div className="space-y-6">
        {events.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No upcoming events</p>
            <p className="text-sm text-gray-400 mt-1">Be the first to create an environmental event!</p>
          </div>
        ) : (
          events.map((event) => (
            <div key={event.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{event.title}</h3>
                    <p className="text-gray-600 mb-4">{event.description}</p>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>{formatEventDate(event.event_date)}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span>{event.location}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Users className="w-4 h-4" />
                        <span>{event.participant_count} / {event.max_participants} participants</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <span>Created by {event.users.full_name}</span>
                      <span>•</span>
                      <span>@{event.users.username}</span>
                    </div>
                  </div>

                  <div className="ml-6 flex flex-col items-end space-y-2">
                    {/* Delete button for event creator */}
                    {userProfile && event.created_by === userProfile.id && (
                      <button
                        onClick={() => handleDeleteEvent(event.id)}
                        className="px-3 py-1 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center space-x-1"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="text-sm">Delete</span>
                      </button>
                    )}
                    
                    {event.is_participant ? (
                      <button
                        onClick={() => handleLeaveEvent(event.id)}
                        className="px-4 py-2 border-2 border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        Leave Event
                      </button>
                    ) : (
                      <button
                        onClick={() => handleJoinEvent(event.id)}
                        disabled={event.participant_count >= event.max_participants}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                      >
                        {event.participant_count >= event.max_participants ? 'Event Full' : 'Join Event'}
                      </button>
                    )}
                    
                    <div className="w-24 h-2 bg-gray-200 rounded-full">
                      <div 
                        className="h-full bg-green-500 rounded-full transition-all"
                        style={{ 
                          width: `${Math.min((event.participant_count / event.max_participants) * 100, 100)}%` 
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Event Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Event</h2>
            
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Event Title</label>
                <input
                  type="text"
                  required
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Beach Cleanup Day"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  required
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Join us for a community beach cleanup to protect marine life..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  required
                  value={newEvent.location}
                  onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Santa Monica Beach, CA"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={newEvent.event_date}
                  onChange={(e) => setNewEvent({ ...newEvent, event_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Participants</label>
                <input
                  type="number"
                  required
                  min="1"
                  max="1000"
                  value={newEvent.max_participants}
                  onChange={(e) => setNewEvent({ ...newEvent, max_participants: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors"
                >
                  Create Event
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}