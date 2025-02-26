'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/services/auth/AuthContext';
import { supabase } from '@/app/services/supabase';
import { EarningsSummary, getEarningsSummary } from '@/app/services/earnings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Loader2 } from 'lucide-react';

export default function EarningsWidget() {
  const [earnings, setEarnings] = useState<EarningsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchEarnings = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const earningsSummary = await getEarningsSummary(user.id, supabase);
        setEarnings(earningsSummary);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch earnings:', err);
        setError('Failed to load earnings data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEarnings();
  }, [user]);

  if (isLoading) {
    return (
      <Card data-testid="earnings-widget">
        <CardHeader>
          <CardTitle>Earnings</CardTitle>
          <CardDescription>Your earnings summary</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card data-testid="earnings-widget">
        <CardHeader>
          <CardTitle>Earnings</CardTitle>
          <CardDescription>Your earnings summary</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!earnings) {
    return (
      <Card data-testid="earnings-widget">
        <CardHeader>
          <CardTitle>Earnings</CardTitle>
          <CardDescription>Your earnings summary</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No earnings data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="earnings-widget">
      <CardHeader>
        <CardTitle>Earnings</CardTitle>
        <CardDescription>Your earnings summary</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="summary">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming Payout</TabsTrigger>
          </TabsList>
          
          <TabsContent value="summary" className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Earnings</p>
                <p className="text-2xl font-bold">{earnings.formattedTotal}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{earnings.formattedPending}</p>
              </div>
            </div>
            <div className="pt-2">
              <p className="text-sm text-muted-foreground">Paid to Date</p>
              <p className="text-xl font-semibold">{earnings.formattedPaid}</p>
            </div>
            
            <div className="pt-4">
              <h4 className="text-sm font-medium mb-2">Recent Earnings</h4>
              <ul className="space-y-2" data-testid="earnings-list">
                {earnings.recentEarnings && earnings.recentEarnings.map(earning => (
                  <li key={earning.id} className="bg-card p-3 rounded-md border flex justify-between items-center">
                    <div>
                      <div className="font-medium">{earning.lessonTitle}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(earning.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{earning.formattedAmount}</div>
                      <div className={`text-xs px-2 py-0.5 rounded-full inline-block capitalize
                        ${earning.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                        {earning.status}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </TabsContent>
          
          <TabsContent value="upcoming" className="pt-4">
            {earnings.nextPayoutDate ? (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Next Payout Date</p>
                  <p className="text-xl font-semibold">{earnings.nextPayoutDate}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="text-2xl font-bold">{earnings.formattedNextPayout}</p>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground py-4">
                No upcoming payout scheduled. Payouts are processed when your pending earnings reach the minimum threshold.
              </p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
