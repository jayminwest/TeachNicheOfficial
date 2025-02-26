import { TypedSupabaseClient } from '@/app/lib/types/supabase';
import { formatCurrency } from '@/app/lib/utils';
import { processCreatorPayout, stripeConfig } from '@/app/services/stripe';

export interface EarningsSummary {
  totalEarnings: number;
  pendingEarnings: number;
  paidEarnings: number;
  formattedTotal: string;
  formattedPending: string;
  formattedPaid: string;
  nextPayoutDate: string | null;
  nextPayoutAmount: number;
  formattedNextPayout: string;
}

export interface EarningsHistoryItem {
  id: string;
  date: string;
  amount: number;
  formattedAmount: string;
  status: 'pending' | 'paid' | 'failed';
  lessonTitle?: string;
  lessonId?: string;
}

export interface PayoutHistoryItem {
  id: string;
  date: string;
  amount: number;
  formattedAmount: string;
  status: 'pending' | 'paid' | 'failed' | 'canceled';
  destination: string;
}

/**
 * Get earnings summary for a creator
 * 
 * @param creatorId Creator's user ID
 * @param supabaseClient Supabase client instance
 * @returns Earnings summary
 */
export const getEarningsSummary = async (
  creatorId: string,
  supabaseClient: TypedSupabaseClient
): Promise<EarningsSummary> => {
  // Get all earnings for the creator
  const { data: earnings, error } = await supabaseClient
    .from('creator_earnings')
    .select('amount, status')
    .eq('creator_id', creatorId);

  if (error) {
    console.error('Failed to fetch earnings:', error);
    throw new Error('Failed to fetch earnings data');
  }

  // Calculate totals
  const totalEarnings = earnings.reduce((sum, item) => sum + item.amount, 0);
  const pendingEarnings = earnings
    .filter(item => item.status === 'pending')
    .reduce((sum, item) => sum + item.amount, 0);
  const paidEarnings = earnings
    .filter(item => item.status === 'paid')
    .reduce((sum, item) => sum + item.amount, 0);

  // Calculate next payout date
  let nextPayoutDate: string | null = null;
  const now = new Date();
  
  if (pendingEarnings >= stripeConfig.minimumPayoutAmount) {
    if (stripeConfig.payoutSchedule === 'weekly') {
      // Next Monday
      const nextMonday = new Date(now);
      nextMonday.setDate(now.getDate() + (8 - now.getDay()) % 7);
      nextPayoutDate = nextMonday.toISOString().split('T')[0];
    } else {
      // First day of next month
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      nextPayoutDate = nextMonth.toISOString().split('T')[0];
    }
  }

  return {
    totalEarnings,
    pendingEarnings,
    paidEarnings,
    formattedTotal: formatCurrency(totalEarnings),
    formattedPending: formatCurrency(pendingEarnings),
    formattedPaid: formatCurrency(paidEarnings),
    nextPayoutDate,
    nextPayoutAmount: pendingEarnings,
    formattedNextPayout: formatCurrency(pendingEarnings)
  };
};

/**
 * Get earnings history for a creator
 * 
 * @param creatorId Creator's user ID
 * @param supabaseClient Supabase client instance
 * @param limit Number of records to return
 * @param offset Offset for pagination
 * @returns Array of earnings history items
 */
export const getEarningsHistory = async (
  creatorId: string,
  supabaseClient: TypedSupabaseClient,
  limit = 10,
  offset = 0
): Promise<EarningsHistoryItem[]> => {
  const { data, error } = await supabaseClient
    .from('creator_earnings')
    .select(`
      id,
      created_at,
      amount,
      status,
      lessons(id, title)
    `)
    .eq('creator_id', creatorId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Failed to fetch earnings history:', error);
    throw new Error('Failed to fetch earnings history');
  }

  return data.map(item => ({
    id: item.id,
    date: new Date(item.created_at).toISOString().split('T')[0],
    amount: item.amount,
    formattedAmount: formatCurrency(item.amount),
    status: item.status,
    lessonTitle: item.lessons?.title,
    lessonId: item.lessons?.id
  }));
};

/**
 * Get payout history for a creator
 * 
 * @param creatorId Creator's user ID
 * @param supabaseClient Supabase client instance
 * @param limit Number of records to return
 * @param offset Offset for pagination
 * @returns Array of payout history items
 */
export const getPayoutHistory = async (
  creatorId: string,
  supabaseClient: TypedSupabaseClient,
  limit = 10,
  offset = 0
): Promise<PayoutHistoryItem[]> => {
  const { data, error } = await supabaseClient
    .from('creator_payouts')
    .select('id, created_at, amount, status, destination_last_four')
    .eq('creator_id', creatorId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Failed to fetch payout history:', error);
    throw new Error('Failed to fetch payout history');
  }

  return data.map(item => ({
    id: item.id,
    date: new Date(item.created_at).toISOString().split('T')[0],
    amount: item.amount,
    formattedAmount: formatCurrency(item.amount),
    status: item.status,
    destination: `••••${item.destination_last_four}`
  }));
};

/**
 * Process pending payouts for all eligible creators
 * This would typically be run as a scheduled job
 * 
 * @param supabaseClient Supabase client instance
 * @returns Results of payout processing
 */
export const processScheduledPayouts = async (
  supabaseClient: TypedSupabaseClient
) => {
  const results = {
    processed: 0,
    failed: 0,
    skipped: 0,
    details: [] as Array<{creatorId: string; status: string; amount?: number; error?: string}>
  };

  try {
    // Get all creators with pending earnings above the minimum threshold
    const { data: eligibleCreators, error } = await supabaseClient.rpc(
      'get_creators_eligible_for_payout',
      { minimum_amount: stripeConfig.minimumPayoutAmount }
    );

    if (error) {
      console.error('Failed to fetch eligible creators:', error);
      throw new Error('Failed to fetch eligible creators for payout');
    }

    // Process payouts for each eligible creator
    for (const creator of eligibleCreators) {
      try {
        const payoutResult = await processCreatorPayout(
          creator.creator_id,
          creator.pending_amount,
          supabaseClient
        );

        if (payoutResult.success) {
          // Update earnings records to 'paid' status
          await supabaseClient.rpc(
            'mark_creator_earnings_as_paid',
            { 
              creator_id: creator.creator_id,
              payout_id: payoutResult.payoutId
            }
          );

          results.processed++;
          results.details.push({
            creatorId: creator.creator_id,
            status: 'success',
            amount: creator.pending_amount
          });
        } else {
          results.failed++;
          results.details.push({
            creatorId: creator.creator_id,
            status: 'failed',
            error: payoutResult.error
          });
        }
      } catch (error) {
        results.failed++;
        results.details.push({
          creatorId: creator.creator_id,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return results;
  } catch (error) {
    console.error('Payout processing failed:', error);
    throw new Error('Failed to process scheduled payouts');
  }
};
