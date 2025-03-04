"use client"

import { Button } from "@/app/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card"
import { Switch } from "@/app/components/ui/switch"
import { toast } from "@/app/components/ui/use-toast"
import { StripeConnectButton } from "@/app/components/ui/stripe-connect-button"
import { useEffect, useState } from "react"

export function AccountSettings() {
  const [stripeStatus, setStripeStatus] = useState<{
    stripeAccountId: string | null;
    isComplete: boolean;
    status?: string;
    details?: any;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch Stripe status on component mount
  useEffect(() => {
    async function fetchStripeStatus() {
      try {
        setIsLoading(true);
        const response = await fetch('/api/stripe/connect/status');
        
        if (response.ok) {
          const data = await response.json();
          console.log('Stripe status:', data);
          setStripeStatus(data);
        } else {
          console.error('Failed to fetch Stripe status:', response.status);
        }
      } catch (error) {
        console.error('Error fetching Stripe status:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchStripeStatus();
  }, []);

  const handleDeleteAccount = async () => {
    // TODO: Implement account deletion logic
    toast({
      title: "Not implemented",
      description: "Account deletion is not yet implemented.",
      variant: "destructive",
    })
  }

  return (
    <div className="space-y-6">

      <Card>
        <CardHeader>
          <CardTitle>Payment Settings</CardTitle>
          <CardDescription>Manage your payment information and payout settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Stripe Connect</h4>
            <p className="text-sm text-muted-foreground">
              Connect your Stripe account to receive payments for your lessons
            </p>
            <div className="mt-2">
              {isLoading ? (
                <div className="text-sm text-muted-foreground">Loading Stripe status...</div>
              ) : (
                <StripeConnectButton 
                  stripeAccountId={stripeStatus?.stripeAccountId} 
                  stripeStatus={stripeStatus ? {
                    isComplete: stripeStatus.isComplete,
                    status: stripeStatus.status || '',
                    details: stripeStatus.details
                  } : undefined}
                />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            Permanently delete your account and all of your content
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            variant="destructive" 
            onClick={handleDeleteAccount}
          >
            Delete Account
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
