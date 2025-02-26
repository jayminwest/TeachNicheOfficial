import { TypedSupabaseClient } from '@/app/lib/types/supabase';
import { formatCurrency } from '@/app/lib/utils';
import { stripeConfig } from '@/app/services/stripe';

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
  recentEarnings?: EarningItem[];
}

export interface EarningItem {
  id: string;
  amount: number;
  formattedAmount: string;
  status: 'pending' | 'paid' | 'failed';
  createdAt: string;
  lessonTitle: string;
  lessonId: string;
}

export interface EarningsHistoryItem {
  id: string;
  date: string;
  amount: number;
  formattedAmount: string;
  status: 'pending' | 'paid' | 'failed';
  lessonTitle?: string;
  lessonId?: string;
  purchaseId?: string;
}

export interface PayoutHistoryItem {
  id: string;
  date: string;
  amount: number;
  formattedAmount: string;
  status: 'pending' | 'paid' | 'failed' | 'canceled';
  destination: string;
  earningsCount: number;
}

/**
 * Calculate creator earnings from a payment amount
 * 
 * @param paymentAmount Total payment amount in cents
 * @returns Creator's earnings after platform fee
 */
export const calculateCreatorEarnings = (paymentAmount: number): number => {
  const platformFeePercent = stripeConfig.platformFeePercent;
  const platformFee = Math.round(paymentAmount * (platformFeePercent / 100));
  return paymentAmount - platformFee;
};

/**
 * Calculate fees for a payment amount
 * 
 * @param paymentAmount Total payment amount in cents
 * @returns Object with platform fee and creator earnings
 */
export const calculateFees = (paymentAmount: number): {
  platformFee: number;
  creatorEarnings: number;
} => {
  const platformFeePercent = stripeConfig.platformFeePercent;
  const platformFee = Math.round(paymentAmount * (platformFeePercent / 100));
  const creatorEarnings = paymentAmount - platformFee;
  
  return {
    platformFee,
    creatorEarnings
  };
};

/**
 * Records earnings for a creator from a payment
 * 
 * @param params Object containing payment details
 */
export const recordCreatorEarnings = async (
  params: {
    paymentIntentId: string;
    creatorId: string;
    amount: number;
    lessonId: string;
    purchaseId: string;
    supabaseClient: TypedSupabaseClient;
  }
): Promise<void> => {
  const { paymentIntentId, creatorId, amount, lessonId, purchaseId, supabaseClient } = params;
  
  try {
    // Calculate fees
    const { platformFee, creatorEarnings } = calculateFees(amount);
    
    await supabaseClient
      .from('creator_earnings')
      .insert({
        creator_id: creatorId,
        payment_intent_id: paymentIntentId,
        amount: creatorEarnings,
        lesson_id: lessonId,
        purchase_id: purchaseId,
        platform_fee: platformFee,
        status: 'pending'
      });
  } catch (error) {
    console.error('Failed to record creator earnings:', error);
    // We log but don't throw here to prevent payment confirmation issues
    // This can be fixed through admin intervention if needed
  }
};

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
  const { data: earningsData, error } = await supabaseClient
    .from('creator_earnings')
    .select(`
      id,
      amount, 
      status,
      created_at,
      lesson_id,
      lessons(id, title)
    `)
    .eq('creator_id', creatorId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch earnings:', error);
    throw new Error('Failed to fetch earnings data');
  }

  // Calculate totals
  const totalEarnings = earningsData.reduce((sum, item) => sum + item.amount, 0);
  const pendingEarnings = earningsData
    .filter(item => item.status === 'pending')
    .reduce((sum, item) => sum + item.amount, 0);
  const paidEarnings = earningsData
    .filter(item => item.status === 'paid')
    .reduce((sum, item) => sum + item.amount, 0);

  // Format recent earnings
  const recentEarnings = earningsData.slice(0, 10).map(item => ({
    id: item.id,
    amount: item.amount,
    formattedAmount: formatCurrency(item.amount / 100), // Convert cents to dollars for display
    status: item.status,
    createdAt: item.created_at,
    lessonTitle: item.lessons?.title || 'Unknown lesson',
    lessonId: item.lesson_id
  }));

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
    formattedTotal: formatCurrency(totalEarnings / 100), // Convert cents to dollars for display
    formattedPending: formatCurrency(pendingEarnings / 100),
    formattedPaid: formatCurrency(paidEarnings / 100),
    nextPayoutDate,
    nextPayoutAmount: pendingEarnings,
    formattedNextPayout: formatCurrency(pendingEarnings / 100),
    recentEarnings
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
      purchase_id,
      lesson_id,
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
    formattedAmount: formatCurrency(item.amount / 100), // Convert cents to dollars for display
    status: item.status,
    lessonTitle: item.lessons?.title,
    lessonId: item.lessons?.id,
    purchaseId: item.purchase_id
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
    .select(`
      id, 
      created_at, 
      amount, 
      status, 
      destination_last_four,
      earnings_count
    `)
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
    formattedAmount: formatCurrency(item.amount / 100), // Convert cents to dollars for display
    status: item.status,
    destination: `••••${item.destination_last_four}`,
    earningsCount: item.earnings_count || 0
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
        // Import dynamically to avoid circular dependencies
        const { processCreatorPayout } = await import('./payouts');
        
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
