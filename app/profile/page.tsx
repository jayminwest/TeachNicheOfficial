import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import ProfileClient from './profile-client'

// Force dynamic to ensure we always check auth status
export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  // Create a Supabase client for the server component
  const cookieStore = await cookies()
  const supabase = createServerComponentClient({ cookies: () => cookieStore })
  
  // Get the session
  const { data: { session } } = await supabase.auth.getSession()
  
  // If no session, redirect to sign in
  if (!session) {
    redirect('/auth/signin?redirect=/profile')
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 pt-16">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Your Profile</h1>
        </div>
        <div className="bg-card rounded-lg border shadow-sm p-6">
          <div className="border-b mb-4">
            <div className="flex space-x-2 mb-4">
              {/* Profile tabs would go here */}
            </div>
          </div>
          
          {/* Import the client component */}
          <ProfileClient />
        </div>
      </div>
      
      <noscript>
        <div className="container max-w-4xl mx-auto px-4 py-8">
          <div className="p-4 bg-yellow-100 text-yellow-800 rounded-md">
            JavaScript is required to view your profile. Please enable JavaScript or use a browser that supports it.
          </div>
        </div>
      </noscript>
    </div>
  );
}
