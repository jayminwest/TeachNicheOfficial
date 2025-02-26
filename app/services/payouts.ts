import { TypedSupabaseClient } from '@/app/lib/types/supabase';
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
  supabaseClient: TypedSupabaseClient
): Promise<PayoutResult> => {
  try {
    // Get creator's bank account information
    const { data: bankInfo, error: bankError } = await supabaseClient
      .from('creator_payout_methods')
      .select('bank_account_token, last_four')
      .eq('creator_id', creatorId)
      .single();

    if (bankError || !bankInfo?.bank_account_token) {
      console.error('Bank account fetch failed:', bankError);
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
      destination: bankInfo.bank_account_token,
      metadata: {
        creatorId,
        type: 'creator_earnings'
      }
    });

    // Record the payout in our database
    const { error: payoutError } = await supabaseClient
      .from('creator_payouts')
      .insert({
        creator_id: creatorId,
        amount,
        status: payout.status as 'pending' | 'paid' | 'failed' | 'canceled',
        payout_id: payout.id,
        destination_last_four: bankInfo.last_four
      });

    if (payoutError) {
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
 * @param supabaseClient Supabase client instance
 * @returns Array of payout results
 */
export const processAllEligiblePayouts = async (
  supabaseClient: TypedSupabaseClient
): Promise<PayoutResult[]> => {
  const results: PayoutResult[] = [];
  
  try {
    // Get all creators with pending earnings above the minimum threshold
    const { data: eligibleCreators, error } = await supabaseClient.rpc<
      {
        creator_id: string;
        pending_amount: number;
      },
      { minimum_amount: number }
    >(
      'get_creators_eligible_for_payout',
      { minimum_amount: stripeConfig.minimumPayoutAmount }
    );
    
    if (error) throw error;
    
    // Process payouts for each eligible creator
    for (const creator of (eligibleCreators || [])) {
      const result = await processCreatorPayout(
        creator.creator_id,
        creator.pending_amount,
        supabaseClient
      );
      
      results.push(result);
    }
    
    return results;
  } catch (error) {
    console.error('Batch payout processing failed:', error);
    throw error;
  }
};
