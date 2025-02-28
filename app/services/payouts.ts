import { DatabaseService } from './database/interface';
import { getStripe, stripeConfig } from './stripe';
import Stripe from 'stripe';

export interface PayoutResult {
  success: boolean;
  payoutId?: string;
  amount?: number;
  error?: string;
  creatorId?: string;
}

/**
 * Process a payout to a creator
 * 
 * @param creatorId Creator's user ID
 * @param amount Amount in cents
 * @param supabaseClient Supabase client instance
 * @returns Payout result
 */
export const processCreatorPayout = async (
  creatorId: string,
  amount: number,
  databaseService: DatabaseService
): Promise<PayoutResult> => {
  try {
    // Get creator's bank account information
    const { rows: bankInfo } = await databaseService.query(`
      SELECT * FROM creator_payout_methods 
      WHERE creator_id = $1 AND is_default = true
      LIMIT 1
    `, [creatorId]);

    interface BankAccountInfo {
      bank_account_token: string;
      last_four?: string;
    }
    
    if (!bankInfo || bankInfo.length === 0 || !(bankInfo[0] as BankAccountInfo)?.bank_account_token) {
      console.error('Bank account fetch failed:', new Error('No bank account found'));
      return {
        success: false,
        error: 'No bank account found for creator',
        creatorId
      };
    }

    // Create a payout using Stripe
    const stripe = getStripe();
    const payout = await (stripe as Stripe).payouts.create({
      amount,
      currency: stripeConfig.defaultCurrency,
      destination: (bankInfo[0] as BankAccountInfo).bank_account_token,
      metadata: {
        creatorId,
        type: 'creator_earnings'
      }
    });

    // Record the payout in our database
    try {
      await databaseService.query(`
        INSERT INTO creator_payouts 
        (creator_id, amount, status, payout_id, destination_last_four, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      `, [
        creatorId,
        amount,
        payout.status as string,
        payout.id,
        (bankInfo[0] as BankAccountInfo).last_four
      ]);
    } catch (payoutError) {
      console.error('Failed to record payout:', payoutError);
      // We don't throw here because the payout was successful in Stripe
      // This is a database recording issue that can be fixed later
    }

    return {
      success: true,
      payoutId: payout.id,
      amount,
      creatorId
    };
  } catch (error) {
    console.error('Payout processing failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process payout',
      creatorId
    };
  }
};

/**
 * Process payouts for all eligible creators
 * 
 * @param databaseService Database service instance
 * @returns Array of payout results
 */
export const processAllEligiblePayouts = async (
  databaseService: DatabaseService
): Promise<PayoutResult[]> => {
  const results: PayoutResult[] = [];
  
  try {
    // Get all creators with pending earnings above the minimum threshold
    // This is a simplified version - in a real implementation, you would need to
    // create a custom query or function to get eligible creators
    interface EligibleCreator {
      creator_id: string;
      pending_amount: number;
    }
    
    const { rows: eligibleCreators } = await databaseService.query<EligibleCreator>(`
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
    
    // Process payouts for each eligible creator
    for (const creator of (eligibleCreators || [])) {
      const result = await processCreatorPayout(
        creator.creator_id,
        creator.pending_amount,
        databaseService
      );
      
      results.push(result);
    }
    
    return results;
  } catch (error) {
    console.error('Batch payout processing failed:', error);
    throw error;
  }
};
