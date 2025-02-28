import { DatabaseService } from './database/interface';
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
    databaseService: DatabaseService;
  }
): Promise<void> => {
  const { paymentIntentId, creatorId, amount, lessonId, purchaseId, databaseService } = params;
  
  try {
    // Calculate fees
    const { platformFee, creatorEarnings } = calculateFees(amount);
    
    // @ts-ignore - DatabaseService interface needs to be updated
    await (databaseService as any).create('creator_earnings', {
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
  databaseService: DatabaseService
): Promise<EarningsSummary> => {
  // Get all earnings for the creator
  interface EarningsData {
    id: string;
    amount: number;
    status: string;
    created_at: string;
    lesson_id: string;
    lesson_title?: string;
  }

  const { rows: earningsData } = await databaseService.query<EarningsData>(`
    SELECT 
      e.id,
      e.amount, 
      e.status,
      e.created_at,
      e.lesson_id,
      l.id as lesson_id,
      l.title as lesson_title
    FROM 
      creator_earnings e
    LEFT JOIN 
      lessons l ON e.lesson_id = l.id
    WHERE 
      e.creator_id = $1
    ORDER BY 
      e.created_at DESC
  `, [creatorId]);

  if (!earningsData || earningsData.length === 0) {
    return {
      totalEarnings: 0,
      pendingEarnings: 0,
      paidEarnings: 0,
      formattedTotal: formatCurrency(0),
      formattedPending: formatCurrency(0),
      formattedPaid: formatCurrency(0),
      nextPayoutDate: null,
      nextPayoutAmount: 0,
      formattedNextPayout: formatCurrency(0)
    };
  }

  // Calculate totals
  const totalEarnings = earningsData.reduce((sum: number, item) => sum + item.amount, 0);
  const pendingEarnings = earningsData
    .filter((item) => item.status === 'pending')
    .reduce((sum: number, item) => sum + item.amount, 0);
  const paidEarnings = earningsData
    .filter((item) => item.status === 'paid')
    .reduce((sum: number, item) => sum + item.amount, 0);

  // Format recent earnings
  const recentEarnings = earningsData.slice(0, 10).map((item) => ({
    id: item.id,
    amount: item.amount,
    formattedAmount: formatCurrency(item.amount / 100), // Convert cents to dollars for display
    status: item.status,
    createdAt: item.created_at,
    lessonTitle: item.lesson_title || 'Unknown lesson',
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
  databaseService: DatabaseService,
  limit = 10,
  offset = 0
): Promise<EarningsHistoryItem[]> => {
  interface EarningsHistoryData {
    id: string;
    created_at: string;
    amount: number;
    status: string;
    purchase_id: string;
    lesson_id: string;
    lesson_title?: string;
  }

  const { rows: data } = await databaseService.query<EarningsHistoryData>(`
    SELECT 
      e.id,
      e.created_at,
      e.amount,
      e.status,
      e.purchase_id,
      e.lesson_id,
      l.id as lesson_id,
      l.title as lesson_title
    FROM 
      creator_earnings e
    LEFT JOIN 
      lessons l ON e.lesson_id = l.id
    WHERE 
      e.creator_id = $1
    ORDER BY 
      e.created_at DESC
    LIMIT $2 OFFSET $3
  `, [creatorId, limit, offset]);

  if (!data || data.length === 0) {
    return [];
  }

  return data.map((item) => ({
    id: item.id,
    date: new Date(item.created_at).toISOString().split('T')[0],
    amount: item.amount,
    formattedAmount: formatCurrency(item.amount / 100), // Convert cents to dollars for display
    status: item.status,
    lessonTitle: item.lesson_title,
    lessonId: item.lesson_id,
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
  databaseService: DatabaseService,
  limit = 10,
  offset = 0
): Promise<PayoutHistoryItem[]> => {
  interface PayoutHistoryData {
    id: string;
    created_at: string;
    amount: number;
    status: string;
    destination_last_four: string;
    earnings_count: number;
  }

  const { rows: data } = await databaseService.query<PayoutHistoryData>(`
    SELECT 
      id, 
      created_at, 
      amount, 
      status, 
      destination_last_four,
      earnings_count
    FROM 
      creator_payouts
    WHERE 
      creator_id = $1
    ORDER BY 
      created_at DESC
    LIMIT $2 OFFSET $3
  `, [creatorId, limit, offset]);

  if (!data || data.length === 0) {
    return [];
  }

  return data.map((item) => ({
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
  databaseService: DatabaseService
) => {
  const results = {
    processed: 0,
    failed: 0,
    skipped: 0,
    details: [] as Array<{creatorId: string; status: string; amount?: number; error?: string}>
  };

  try {
    // Get all creators with pending earnings above the minimum threshold
    const { rows: eligibleCreators } = await databaseService.query(`
      SELECT 
        creator_id, 
        SUM(amount) as pending_amount
      FROM 
        creator_earnings
      WHERE 
        status = 'pending'
      GROUP BY 
        creator_id
      HAVING 
        SUM(amount) >= $1
    `, [stripeConfig.minimumPayoutAmount]);

    if (!eligibleCreators || eligibleCreators.length === 0) {
      return results;
    }

    // Process payouts for each eligible creator
    for (const creator of (eligibleCreators || [])) {
      try {
        // Import dynamically to avoid circular dependencies
        const { processCreatorPayout } = await import('./payouts');
        
        const payoutResult = await processCreatorPayout(
          (creator as any).creator_id,
          (creator as any).pending_amount,
          databaseService
        );

        if (payoutResult.success) {
          // Update earnings records to 'paid' status
          await databaseService.query(`
            UPDATE creator_earnings
            SET 
              status = 'paid',
              payout_id = $1,
              updated_at = NOW()
            WHERE 
              creator_id = $2
              AND status = 'pending'
          `, [payoutResult.payoutId, (creator as any).creator_id]);

          results.processed++;
          results.details.push({
            creatorId: (creator as any).creator_id,
            status: 'success',
            amount: (creator as any).pending_amount
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
          creatorId: (creator as any).creator_id,
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
