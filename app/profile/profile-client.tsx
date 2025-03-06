'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Loader2 } from 'lucide-react'

export default function ProfileClient() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  const supabase = createClientComponentClient()
  
  useEffect(() => {
    async function loadProfile() {
      try {
        // Get the current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError) throw userError
        
        if (!user) {
          throw new Error('No user found')
        }
        
        // Get the profile data
        const { data, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        if (profileError) throw profileError
        
        setProfile(data)
      } catch (err) {
        console.error('Error loading profile:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    
    loadProfile()
  }, [supabase])
  
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
        <p>Loading your profile...</p>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="p-4 border border-red-300 bg-red-50 text-red-800 rounded-md">
        <h3 className="font-bold">Error loading profile</h3>
        <p>{error}</p>
      </div>
    )
  }
  
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Welcome, {profile?.full_name || 'User'}</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <div className="p-2 border rounded-md bg-muted/20">{profile?.email}</div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
          <div className="p-2 border rounded-md bg-muted/20 min-h-[100px]">
            {profile?.bio || 'No bio provided'}
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Social Media</label>
          <div className="p-2 border rounded-md bg-muted/20">
            {profile?.social_media_tag || 'Not provided'}
          </div>
        </div>
      </div>
    </div>
  )
}
