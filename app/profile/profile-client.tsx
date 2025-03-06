'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Loader2, User, CreditCard, BookOpen, Settings, PencilIcon } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs'
import { StripeConnectButton } from '@/app/components/ui/stripe-connect-button'
import { Button } from '@/app/components/ui/button'
import { useToast } from '@/app/components/ui/use-toast'

export default function ProfileClient() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('profile')
  const [lessons, setLessons] = useState([])
  const [lessonsLoading, setLessonsLoading] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [formData, setFormData] = useState({
    full_name: '',
    bio: '',
    social_media_tag: ''
  })
  const [updating, setUpdating] = useState(false)
  
  const { toast } = useToast()
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
        setFormData({
          full_name: data.full_name || '',
          bio: data.bio || '',
          social_media_tag: data.social_media_tag || ''
        })
      } catch (err) {
        console.error('Error loading profile:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    
    loadProfile()
  }, [supabase])
  
  useEffect(() => {
    if (activeTab === 'content' && profile) {
      loadUserLessons()
    }
  }, [activeTab, profile])
  
  const loadUserLessons = async () => {
    if (!profile) return
    
    setLessonsLoading(true)
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('creator_id', profile.id)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      setLessons(data || [])
    } catch (err) {
      console.error('Error loading lessons:', err)
      toast({
        variant: 'destructive',
        title: 'Error loading lessons',
        description: err.message
      })
    } finally {
      setLessonsLoading(false)
    }
  }
  
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }
  
  const handleProfileUpdate = async () => {
    if (!profile) return
    
    setUpdating(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          bio: formData.bio,
          social_media_tag: formData.social_media_tag,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id)
      
      if (error) throw error
      
      // Update local profile state
      setProfile(prev => ({
        ...prev,
        ...formData,
        updated_at: new Date().toISOString()
      }))
      
      setEditMode(false)
      toast({
        title: 'Profile updated',
        description: 'Your profile information has been updated successfully.'
      })
    } catch (err) {
      console.error('Error updating profile:', err)
      toast({
        variant: 'destructive',
        title: 'Error updating profile',
        description: err.message
      })
    } finally {
      setUpdating(false)
    }
  }
  
  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return
    }
    
    try {
      // First mark the profile as deleted
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', profile.id)
      
      if (profileError) throw profileError
      
      // Then sign out
      const { error: signOutError } = await supabase.auth.signOut()
      if (signOutError) throw signOutError
      
      // Redirect to home page
      window.location.href = '/'
    } catch (err) {
      console.error('Error deleting account:', err)
      toast({
        variant: 'destructive',
        title: 'Error deleting account',
        description: err.message
      })
    }
  }
  
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
    <Tabs defaultValue="profile" value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid grid-cols-4 mb-8">
        <TabsTrigger value="profile" className="flex items-center gap-2">
          <User className="h-4 w-4" /> Profile
        </TabsTrigger>
        <TabsTrigger value="payments" className="flex items-center gap-2">
          <CreditCard className="h-4 w-4" /> Payments
        </TabsTrigger>
        <TabsTrigger value="content" className="flex items-center gap-2">
          <BookOpen className="h-4 w-4" /> Content
        </TabsTrigger>
        <TabsTrigger value="settings" className="flex items-center gap-2">
          <Settings className="h-4 w-4" /> Settings
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="profile" className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Profile Information</h2>
          {!editMode ? (
            <Button onClick={() => setEditMode(true)} variant="outline" size="sm">
              <PencilIcon className="h-4 w-4 mr-2" /> Edit Profile
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button onClick={() => setEditMode(false)} variant="outline" size="sm">
                Cancel
              </Button>
              <Button onClick={handleProfileUpdate} disabled={updating} size="sm">
                {updating ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          )}
        </div>
        
        {!editMode ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <div className="p-2 border rounded-md bg-muted/20">
                {profile?.full_name || 'Not provided'}
              </div>
            </div>
            
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
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-md"
                placeholder="Your name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <div className="p-2 border rounded-md bg-muted/20">{profile?.email}</div>
              <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-md min-h-[100px]"
                placeholder="Tell us about yourself"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Social Media</label>
              <input
                type="text"
                name="social_media_tag"
                value={formData.social_media_tag}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-md"
                placeholder="@yourusername"
              />
            </div>
          </div>
        )}
      </TabsContent>
      
      <TabsContent value="payments" className="space-y-4">
        <h2 className="text-xl font-semibold mb-4">Payment Settings</h2>
        <p className="mb-4">Connect your Stripe account to receive payments for your lessons.</p>
        
        <StripeConnectButton 
          stripeAccountId={profile?.stripe_account_id} 
          stripeStatus={profile?.stripe_account_status ? {
            isComplete: profile.stripe_onboarding_complete || false,
            status: profile.stripe_account_status,
            details: profile.stripe_account_details
          } : null}
        />
      </TabsContent>
      
      <TabsContent value="content" className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Your Content</h2>
          <Button onClick={() => window.location.href = '/lessons/create'} size="sm">
            Create New Lesson
          </Button>
        </div>
        
        {lessonsLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
            <p>Loading your lessons...</p>
          </div>
        ) : lessons.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {lessons.map(lesson => (
              <div key={lesson.id} className="border rounded-md p-4 flex justify-between items-center">
                <div>
                  <h3 className="font-medium">{lesson.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {lesson.status === 'published' ? 'Published' : 'Draft'} • ${lesson.price}
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.location.href = `/lessons/${lesson.id}/edit`}
                >
                  Edit
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center p-8 border rounded-md bg-muted/10">
            <p className="mb-4">You haven't created any lessons yet.</p>
            <Button onClick={() => window.location.href = '/lessons/create'}>
              Create Your First Lesson
            </Button>
          </div>
        )}
      </TabsContent>
      
      <TabsContent value="settings" className="space-y-4">
        <h2 className="text-xl font-semibold mb-4">Account Settings</h2>
        
        <div className="space-y-8">
          <div>
            <h3 className="text-lg font-medium mb-2">Password</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Change your password to keep your account secure.
            </p>
            <Button 
              variant="outline"
              onClick={() => window.location.href = '/auth/reset-password'}
            >
              Change Password
            </Button>
          </div>
          
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium mb-2 text-destructive">Danger Zone</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Once you delete your account, there is no going back. Please be certain.
            </p>
            <Button 
              variant="destructive"
              onClick={handleDeleteAccount}
            >
              Delete Account
            </Button>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  )
}
