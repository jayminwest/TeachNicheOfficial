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

export function AccountSettings() {
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
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Manage your notification preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h4 className="text-sm font-medium">Email notifications</h4>
              <p className="text-sm text-muted-foreground">
                Receive email updates about your account activity
              </p>
            </div>
            <Switch />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment Settings</CardTitle>
          <CardDescription>Manage your payment information and payout settings</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline">
            Connect Stripe Account
          </Button>
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
