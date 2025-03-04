import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/database';
import { stripeConfig } from '@/app/services/stripe';
import { calculateFees } from '@/app/lib/utils';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27.acacia'
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Helper function to create Supabase client with awaited cookies
async function getSupabaseClient() {
  const cookieStore = cookies();
  return createRouteHandlerClient<Database>({ cookies: () => cookieStore });
}

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    );

    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntent(event.data.object as Stripe.PaymentIntent);
        break;

      case 'account.updated':
        await handleAccount(event.data.object as Stripe.Account);
        break;
    
      // Add handling for Express account events
      case 'account.application.authorized':
        await handleAccountAuthorized(event.data.object as Stripe.Account);
        break;
    
      case 'account.application.deauthorized':
        await handleAccountDeauthorized(event.data.object as Stripe.Account);
        break;
        
      case 'account.external_account.created':
        await handleExternalAccountCreated(event.data.object as Stripe.BankAccount | Stripe.Card);
        break;

      // Add more event types as needed
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err);
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    );
  }
}

async function handlePaymentIntent(paymentIntent: Stripe.PaymentIntent): Promise<void> {
  try {
    const supabase = await getSupabaseClient();
    
    // Get purchase record by payment intent with lesson and creator details
    const { data: purchase, error: fetchError } = await supabase
    .from('purchases')
    .select(`
      *,
      lesson:lessons(
        creator:profiles!lessons_creator_id_fkey(
          stripe_account_id
        )
      )
    `)
    .eq('payment_intent_id', paymentIntent.id)
    .single()

  if (fetchError || !purchase) {
    console.error('Purchase fetch error:', fetchError);
    return;
  }

  // Calculate fees for creator earnings
  const { creatorEarnings } = calculateFees(purchase.amount)

  const creatorStripeAccountId = purchase.lesson.creator.stripe_account_id;
  if (!creatorStripeAccountId) {
    console.error('Creator stripe account not found for purchase:', purchase.id);
    return;
  }

  // Create transfer to creator
  try {
    const transfer = await stripe.transfers.create({
      amount: creatorEarnings,
      currency: stripeConfig.defaultCurrency,
      destination: creatorStripeAccountId,
      transfer_group: purchase.stripe_session_id,
      source_transaction: paymentIntent.id
    });

    // Update purchase status with transfer info
    const { error: updateError } = await supabase
      .from('purchases')
      .update({
        status: 'completed',
        purchase_date: new Date().toISOString(),
        metadata: {
          stripe_payment_status: paymentIntent.status,
          payment_completed_at: new Date().toISOString(),
          transfer_id: transfer.id,
          ...(typeof purchase.metadata === 'object' ? purchase.metadata : {})
        }
      })
      .eq('id', purchase.id);

    if (updateError) {
      console.error('Purchase update error:', updateError);
      return;
    }

    console.log('Purchase completed:', purchase.id);
  } catch (err) {
    console.error('Transfer creation error:', err);
    return;
  }
  } catch (error) {
    console.error('Payment intent handling error:', error);
    return;
  }
}

async function handleAccountAuthorized(account: Stripe.Account): Promise<void> {
  try {
    const supabase = await getSupabaseClient();
    
    // Update creator's profile with authorized status
    const { error: updateError } = await supabase
    .from('profiles')
    .update({
      stripe_account_status: 'authorized',
      updated_at: new Date().toISOString()
    })
    .eq('stripe_account_id', account.id);

    if (updateError) {
      console.error('Profile update error:', updateError);
      return;
    }

    console.log('Creator account authorized:', account.id);
  } catch (error) {
    console.error('Account authorized handling error:', error);
    return;
  }
}

async function handleAccountDeauthorized(account: Stripe.Account): Promise<void> {
  try {
    const supabase = await getSupabaseClient();
    
    // Update creator's profile with deauthorized status
    const { error: updateError } = await supabase
    .from('profiles')
    .update({
      stripe_account_status: 'deauthorized',
      stripe_onboarding_complete: false,
      updated_at: new Date().toISOString()
    })
    .eq('stripe_account_id', account.id);

    if (updateError) {
      console.error('Profile update error:', updateError);
      return;
    }

    console.log('Creator account deauthorized:', account.id);
  } catch (error) {
    console.error('Account deauthorized handling error:', error);
    return;
  }
}

async function handleAccount(account: Stripe.Account): Promise<void> {
  const supabase = await getSupabaseClient();
  
  // Check if charges_enabled and payouts_enabled are true
  const isComplete = !!(account.details_submitted && account.charges_enabled && account.payouts_enabled);
  
  // Get any requirements information
  const missingRequirements = account.requirements?.currently_due || [];
  const pendingVerification = Array.isArray(account.requirements?.pending_verification) && 
                             account.requirements.pending_verification.length > 0;
  
  // Determine a more specific status for user-friendly display
  let detailedStatus = isComplete ? 'verified' : 'pending';
  
  if (!isComplete) {
    if (pendingVerification) {
      detailedStatus = 'verification_pending';
    } else if (missingRequirements.length > 0) {
      detailedStatus = 'requirements_needed';
    } else if (!account.details_submitted) {
      detailedStatus = 'details_needed';
    } else if (!account.charges_enabled) {
      detailedStatus = 'charges_disabled';
    } else if (!account.payouts_enabled) {
      detailedStatus = 'payouts_disabled';
    }
  }
  
  // Update creator's profile with account status
  // First check if the columns exist in the schema
  try {
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        stripe_onboarding_complete: isComplete,
        updated_at: new Date().toISOString()
      })
      .eq('stripe_account_id', account.id);

    if (updateError) {
      console.error('Basic profile update error:', updateError);
      return;
    }
    
    // Try to update the status fields separately
    try {
      await supabase
        .from('profiles')
        .update({
          stripe_account_status: detailedStatus
        })
        .eq('stripe_account_id', account.id);
    } catch (statusError) {
      console.error('Status field update error:', statusError);
      // Continue execution - this field might not exist yet
    }
    
    // Try to update the details field separately
    try {
      await supabase
        .from('profiles')
        .update({
          stripe_account_details: {
            pending_verification: pendingVerification,
            missing_requirements: missingRequirements,
            has_charges_enabled: account.charges_enabled,
            has_payouts_enabled: account.payouts_enabled,
            has_details_submitted: account.details_submitted,
            detailed_status: detailedStatus,
            last_checked: new Date().toISOString()
          }
        })
        .eq('stripe_account_id', account.id);
    } catch (detailsError) {
      console.error('Details field update error:', detailsError);
      // Continue execution - this field might not exist yet
    }
  } catch (error) {
    console.error('Profile update error:', error);
    return;
  }

  console.log('Creator account status updated:', account.id, 'Status:', detailedStatus);
}

async function handleExternalAccountCreated(externalAccount: Stripe.BankAccount | Stripe.Card): Promise<void> {
  try {
    // Only process bank accounts
    if (externalAccount.object !== 'bank_account') {
      return;
    }
    
    const bankAccount = externalAccount as Stripe.BankAccount;
    const accountId = bankAccount.account;
    
    const supabase = await getSupabaseClient();
    
    // Update profile to indicate bank account was added
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        stripe_has_bank_account: true,
        updated_at: new Date().toISOString()
      })
      .eq('stripe_account_id', accountId);

    if (updateError) {
      console.error('Profile update error:', updateError);
      return;
    }

    console.log('Bank account added for account:', accountId);
  } catch (error) {
    console.error('External account handling error:', error);
    return;
  }
}

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServerSupabaseClient } from '@/app/lib/supabase/server';
import { purchasesService } from '@/app/services/database/purchasesService';

// Initialize Stripe with the secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27.acacia',
});

// This is your Stripe webhook secret for testing your endpoint locally
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  const payload = await request.text();
  const sig = request.headers.get('stripe-signature');

  let event: Stripe.Event;

  try {
    if (!sig || !endpointSecret) {
      console.error('Missing signature or endpoint secret');
      return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
    }

    // Verify the event came from Stripe
    event = stripe.webhooks.constructEvent(payload, sig, endpointSecret);
  } catch (err) {
    console.error(`Webhook Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
  }

  // Handle the checkout.session.completed event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    
    try {
      // Update the purchase status in the database
      const { data, error } = await purchasesService.updatePurchaseStatus(
        session.id,
        'completed'
      );

      if (error) {
        console.error('Error updating purchase status:', error);
        return NextResponse.json({ error: 'Failed to update purchase status' }, { status: 500 });
      }

      console.log(`Purchase ${data?.id} marked as completed`);
      return NextResponse.json({ success: true });
    } catch (err) {
      console.error('Error processing webhook:', err);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }

  // Return a response to acknowledge receipt of the event
  return NextResponse.json({ received: true });
}
