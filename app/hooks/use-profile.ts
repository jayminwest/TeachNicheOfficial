'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/app/services/auth/AuthContext'
import { getProfileById, updateProfile } from '@/app/services/profile/profileService'
import { Profile } from '@/app/types/profile'

interface ProfileUpdateData {
  full_name?: string
  bio?: string
  avatar_url?: string
  social_media_tag?: string
}

interface UseProfileReturn {
  profile: Profile | null
  loading: boolean
  error: Error | null
  updateProfile: (data: ProfileUpdateData) => Promise<{
    success: boolean
    error: Error | null
  }>
  refreshProfile: () => Promise<void>
}

export function useProfile(): UseProfileReturn {
  const { user, loading: authLoading } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  
  // Function to fetch profile data
  const fetchProfile = async (userId: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const { data, error } = await getProfileById(userId)
      
      if (error) {
        throw error
      }
      
      setProfile(data as Profile)
    } catch (err) {
      console.error('Error fetching profile:', err)
      setError(err instanceof Error ? err : new Error('Failed to fetch profile'))
    } finally {
      setLoading(false)
    }
  }
  
  // Refresh profile function that can be called manually
  const refreshProfile = async () => {
    if (!user) {
      setProfile(null)
      setLoading(false)
      return
    }
    
    await fetchProfile(user.id)
  }
  
  // Update profile function
  const handleUpdateProfile = async (data: ProfileUpdateData) => {
    if (!user) {
      return {
        success: false,
        error: new Error('User not authenticated')
      }
    }
    
    try {
      const { data: updatedProfile, error: updateError } = await updateProfile(user.id, data)
      
      if (updateError) {
        throw updateError
      }
      
      // Update local state with the new profile data
      setProfile(updatedProfile)
      
      return {
        success: true,
        error: null
      }
    } catch (err) {
      console.error('Error updating profile:', err)
      const errorObj = err instanceof Error ? err : new Error('Failed to update profile')
      
      return {
        success: false,
        error: errorObj
      }
    }
  }
  
  // Fetch profile when user changes
  useEffect(() => {
    if (authLoading) {
      return
    }
    
    if (!user) {
      setProfile(null)
      setLoading(false)
      return
    }
    
    fetchProfile(user.id)
  }, [user, authLoading])
  
  return {
    profile,
    loading: loading || authLoading,
    error,
    updateProfile: handleUpdateProfile,
    refreshProfile
  }
}
