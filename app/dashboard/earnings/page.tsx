import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { BankAccountForm } from "@/app/components/ui/bank-account-form";
import EarningsHistory from "../components/earnings-history";
import PayoutHistory from "../components/payout-history";

export default function EarningsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 pt-16">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col gap-2 mb-6">
          <div className="flex items-center gap-2">
            <Link 
              href="/dashboard" 
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 p-1 rounded-md hover:bg-muted transition-colors"
              data-testid="back-to-dashboard"
              aria-label="Return to dashboard"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-left">
                <path d="m12 19-7-7 7-7"/>
                <path d="M19 12H5"/>
              </svg>
              <span>Back to Dashboard</span>
            </Link>
          </div>
          <h1 className="text-3xl font-bold">Earnings & Payouts</h1>
          <p className="text-muted-foreground">Track your revenue, payment history, and upcoming payouts</p>
        </div>
        
        <Suspense
          fallback={
            <div className="flex justify-center items-center min-h-[400px]">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          }
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Tabs defaultValue="earnings" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="earnings">Earnings</TabsTrigger>
                  <TabsTrigger value="payouts">Payouts</TabsTrigger>
                </TabsList>
                
                <TabsContent value="earnings" className="space-y-4 pt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle data-testid="earnings-summary">Earnings Summary</CardTitle>
                      <CardDescription>Overview of your lesson sales earnings</CardDescription>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">85% Revenue Share</span>
                        <span className="text-xs px-2 py-1 bg-muted rounded-full">Updated Daily</span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div data-testid="total-earnings">
                        <EarningsHistory />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="payouts" className="space-y-4 pt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Payout History</CardTitle>
                      <CardDescription>History of payouts to your bank account</CardDescription>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs px-2 py-1 bg-muted rounded-full">Weekly Schedule</span>
                        <span className="text-xs px-2 py-1 bg-muted rounded-full">$50 Minimum</span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <PayoutHistory />
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
            
            <div>
              <BankAccountForm />
              
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Payout Information</CardTitle>
                  <CardDescription>How payouts work on Teach Niche</CardDescription>
                  <div className="absolute top-4 right-4">
                    <Link 
                      href="/help/creator-payouts" 
                      className="text-xs text-muted-foreground hover:text-foreground"
                      aria-label="Learn more about creator payouts"
                    >
                      Learn more
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-medium">Payout Schedule</h3>
                    <p className="text-sm text-muted-foreground">
                      Payouts are processed weekly for all earnings that have cleared the 
                      payment processing period.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium">Revenue Share</h3>
                    <p className="text-sm text-muted-foreground">
                      You receive 85% of the lesson price. Teach Niche retains 15% as a platform fee.
                      Stripe processing fees are paid by the buyer.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium">Minimum Payout</h3>
                    <p className="text-sm text-muted-foreground">
                      The minimum payout amount is $50. Earnings below this amount will roll over to the next payout period.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </Suspense>
      </div>
    </div>
  );
}
