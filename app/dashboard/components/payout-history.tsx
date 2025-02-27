'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/services/auth/AuthContext';
import { supabase } from '@/app/services/supabase';
import { PayoutHistoryItem, getPayoutHistory } from '@/app/services/earnings';
import { Loader2 } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { formatCurrency } from '@/app/lib/utils';

export default function PayoutHistory() {
  const [payouts, setPayouts] = useState<PayoutHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const { user } = useAuth();
  const pageSize = 10;

  useEffect(() => {
    const fetchPayouts = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const payoutHistory = await getPayoutHistory(
          user.id, 
          supabase, 
          pageSize, 
          page * pageSize
        );
        
        if (page === 0) {
          setPayouts(payoutHistory);
        } else {
          setPayouts(prev => [...prev, ...payoutHistory]);
        }
        
        setHasMore(payoutHistory.length === pageSize);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch payout history:', err);
        setError('Failed to load payout history');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPayouts();
  }, [user, page]);

  const loadMore = () => {
    setPage(prev => prev + 1);
  };

  if (isLoading && page === 0) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-4">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  if (payouts.length === 0) {
    return (
      <div className="py-4">
        <p className="text-muted-foreground">No payout history available yet. Payouts are processed when your earnings reach the minimum threshold.</p>
      </div>
    );
  }

  // Calculate total payouts
  const totalPayouts = payouts.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="space-y-4" data-testid="payout-history">
      <div className="bg-muted/50 p-4 rounded-lg">
        <p className="text-sm text-muted-foreground">Total Paid Out</p>
        <p className="text-2xl font-bold">{formatCurrency(totalPayouts / 100)}</p>
      </div>
      
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Payout History</h3>
        <div className="space-y-2">
          {payouts.map(item => (
            <div 
              key={item.id} 
              className="bg-card p-3 rounded-md border flex justify-between items-center"
            >
              <div>
                <div className="font-medium">Payout to {item.destination}</div>
                <div className="text-sm text-muted-foreground">{item.date}</div>
                <div className="text-xs text-muted-foreground">
                  {item.earningsCount} {item.earningsCount === 1 ? 'earning' : 'earnings'}
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium">{item.formattedAmount}</div>
                <div className={`text-xs px-2 py-0.5 rounded-full inline-block capitalize
                  ${item.status === 'paid' ? 'bg-green-100 text-green-800' : 
                    item.status === 'pending' ? 'bg-amber-100 text-amber-800' : 
                    item.status === 'failed' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'}`}
                >
                  {item.status}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {isLoading && page > 0 && (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
        
        {hasMore && !isLoading && (
          <Button 
            variant="outline" 
            className="w-full mt-2" 
            onClick={loadMore}
          >
            Load More
          </Button>
        )}
      </div>
    </div>
  );
}
