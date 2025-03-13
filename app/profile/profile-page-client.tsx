'use client';

import { useAuth } from '@/app/services/auth/AuthContext';
import ProfileClient from './profile-client';
import { Loader2 } from 'lucide-react';
import ProfileRedirect from './profile-redirect';

export default function ProfilePageClient() {
  const { loading, isAuthenticated } = useAuth();
  
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
  
  // Redirect if not authenticated - using a separate client component
  if (!isAuthenticated) {
    return <ProfileRedirect />;
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 pt-16">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Your Profile</h1>
        </div>
        <div className="bg-card rounded-lg border shadow-sm p-6">
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
