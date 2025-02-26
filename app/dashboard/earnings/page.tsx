import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { BankAccountForm } from "@/app/components/ui/bank-account-form";
import EarningsHistory from "../components/earnings-history";
import PayoutHistory from "../components/payout-history";

export default function EarningsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 pt-16">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Earnings & Payouts</h1>
        
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
