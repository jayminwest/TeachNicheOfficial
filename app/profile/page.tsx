import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { ProfileForm } from "./components/profile-form"
import { AccountSettings } from "./components/account-settings"
import { ContentManagement } from "./components/content-management"
import { StripeConnectButton } from "@/components/ui/stripe-connect-button"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export default async function ProfilePage() {
  const supabase = createServerComponentClient({ cookies })
  
  // Get the user's profile data including stripe_account_id
  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_account_id')
    .single()
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
                  <StripeConnectButton stripeAccountId={profile?.stripe_account_id} />
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
