'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs"
import { Card } from "@/app/components/ui/card"
import { ProfileForm } from "./components/profile-form"
import { AccountSettings } from "./components/account-settings"
import { ContentManagement } from "./components/content-management"
import { StripeConnectButton } from "@/app/components/ui/stripe-connect-button"
import { useAuth } from "@/app/services/auth/AuthContext"
import { useEffect, useState } from "react"
import { supabase } from "@/app/services/supabase"
import { redirect } from "next/navigation"
import { useRouter } from "next/navigation"

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<{ 
    stripe_account_id: string | null;
  } | null>(null);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  useEffect(() => {
    // Don't run the effect if still loading
    if (loading) return;
    
    // Mark initial load as complete
    setInitialLoadComplete(true);
    
    if (!user) {
      // Handle redirect in a way that works in both browser and test environments
      router.push('/');
      return;
    }

    async function fetchProfile() {
      if (!user?.id) return;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('stripe_account_id')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      setProfile(data);
    }

    fetchProfile();
  }, [user, loading, router]);

  // Show loading state before initial auth check completes
  if (loading && !initialLoadComplete) {
    return <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 pt-16">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        Loading...
      </div>
    </div>;
  }

  // After initial load, if no user and not loading, show unauthenticated state
  if (!user && !loading) {
    // For test environment, render a placeholder instead of redirecting
    return <div data-testid="unauthenticated-placeholder">
      Please sign in to view your profile
    </div>;
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 pt-16">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <Card className="p-6">
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            <TabsContent value="profile">
              <ProfileForm />
            </TabsContent>
            <TabsContent value="content">
              <ContentManagement />
            </TabsContent>
            <TabsContent value="settings">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium">Stripe Connect</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Connect your Stripe account to receive payments for your lessons
                  </p>
                  <StripeConnectButton 
                    stripeAccountId={profile?.stripe_account_id}
                  />
                </div>
                <AccountSettings />
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  )
}
