'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/services/auth/AuthContext';
import ProfileClient from './profile-client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Loader2 } from 'lucide-react';

export default function ProfilePage() {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  
  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-lg">Loading...</p>
        </div>
      </div>
    );
  }
  
  // Redirect if not authenticated
  if (!isAuthenticated) {
    router.push('/auth/signin?redirect=/profile');
    // This element helps with testing
    return <div data-testid="unauthenticated-redirect">Redirecting to login...</div>;
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 pt-16">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Your Profile</h1>
        </div>
        <div className="bg-card rounded-lg border shadow-sm p-6">
          <Tabs defaultValue="profile">
            <TabsList className="mb-4">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            
            <TabsContent value="profile">
              <ProfileClient />
            </TabsContent>
            
            <TabsContent value="content">
              <h2 className="text-xl font-semibold mb-4">Your Content</h2>
              <p>Manage your lessons and content here.</p>
            </TabsContent>
            
            <TabsContent value="settings">
              <h2 className="text-xl font-semibold mb-4">Stripe Connect</h2>
              <p className="mb-4">Connect your Stripe account to receive payments for your lessons</p>
            </TabsContent>
          </Tabs>
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
