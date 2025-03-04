import { DatabaseService, DatabaseResponse } from './databaseService'
import { PurchaseStatus, LessonAccess, Purchase } from '@/types/purchase'

export interface PurchaseCreateData {
  lessonId: string;
  userId: string;
  amount: number;
  stripeSessionId: string;
  paymentIntentId?: string;
  fromWebhook?: boolean;
}

export class PurchasesService extends DatabaseService {
  /**
   * Verify a Stripe session directly with the Stripe API
   */
  async verifyStripeSession(sessionId: string): Promise<DatabaseResponse<{
    isPaid: boolean;
    amount?: number;
    lessonId?: string;
    userId?: string;
  }>> {
    try {
      // Initialize Stripe
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: '2025-01-27.acacia',
      });
      
      // Retrieve the session from Stripe
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      
      // Extract IDs from session
      const lessonId = session.metadata?.lessonId;
      const userId = session.metadata?.userId;
      
      // Check if the session is paid
      const isPaid = session.payment_status === 'paid';
      const amount = session.amount_total ? session.amount_total / 100 : undefined;
      
      return {
        data: {
          isPaid,
          amount,
          lessonId,
          userId
        },
        error: null
      };
    } catch (error) {
      console.error('Error verifying Stripe session:', error);
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Unknown error verifying Stripe session')
      };
    }
  }
  /**
   * Check if a user has access to a lesson
   */
  async checkLessonAccess(userId: string, lessonId: string): Promise<DatabaseResponse<LessonAccess>> {
    return this.executeWithRetry(async () => {
      const supabase = this.getClient();
      
      // First check if the lesson is free
      const { data: lessonData, error: lessonError } = await supabase
        .from('lessons')
        .select('price, creator_id')
        .eq('id', lessonId)
        .single();
      
      if (lessonError) {
        return { data: null, error: lessonError };
      }
      
      // If the lesson is free or the user is the instructor, they have access
      if (lessonData.price === 0 || lessonData.creator_id === userId) {
        return { 
          data: { 
            hasAccess: true, 
            purchaseStatus: 'none' 
          }, 
          error: null 
        };
      }
      
      // Check if the user has purchased the lesson
      const { data: purchaseData, error: purchaseError } = await supabase
        .from('purchases')
        .select('status, created_at')
        .eq('lesson_id', lessonId)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1);
      
      // If we got results, use the first one
      const latestPurchase = purchaseData && purchaseData.length > 0 ? purchaseData[0] : null;
      
      // If there was an error or no purchase found, user doesn't have access
      if (purchaseError || !latestPurchase) {
        return { 
          data: { 
            hasAccess: false, 
            purchaseStatus: 'none' 
          }, 
          error: null 
        };
      }
      
      // Determine access based on purchase status
      const hasAccess = latestPurchase.status === 'completed';
      
      return { 
        data: { 
          hasAccess, 
          purchaseStatus: latestPurchase.status as PurchaseStatus,
          purchaseDate: latestPurchase.created_at
        }, 
        error: null 
      };
    });
  }
  
  /**
   * Create a new purchase record
   */
  async createPurchase(data: PurchaseCreateData): Promise<DatabaseResponse<{ id: string }>> {
    return this.executeWithRetry(async () => {
      const supabase = this.getClient();
      
      console.log('Creating purchase record:', {
        lessonId: data.lessonId,
        userId: data.userId,
        amount: data.amount,
        sessionId: data.stripeSessionId,
        fromWebhook: data.fromWebhook
      });
      
      // First check if a purchase already exists for this user and lesson
      const { data: existingUserLessonPurchase, error: userLessonError } = await supabase
        .from('purchases')
        .select('id, status, stripe_session_id')
        .eq('lesson_id', data.lessonId)
        .eq('user_id', data.userId)
        .order('created_at', { ascending: false })
        .limit(1);
      
      // If a completed purchase already exists, just return it
      if (!userLessonError && existingUserLessonPurchase?.length > 0 && 
          existingUserLessonPurchase[0].status === 'completed') {
        console.log(`User already has a completed purchase for this lesson: ${existingUserLessonPurchase[0].id}`);
        return { data: { id: existingUserLessonPurchase[0].id }, error: null };
      }
      
      // Then check if a purchase record already exists with this session ID
      const { data: existingSessionPurchase, error: sessionError } = await supabase
        .from('purchases')
        .select('id, status')
        .eq('stripe_session_id', data.stripeSessionId)
        .limit(1);
      
      // If a purchase with this session ID exists, update it if needed
      if (!sessionError && existingSessionPurchase?.length > 0) {
        const existingPurchase = existingSessionPurchase[0];
        console.log(`Purchase already exists with session ID ${data.stripeSessionId}, status: ${existingPurchase.status}`);
        
        // Only update if not already completed and we're coming from webhook or verification
        if (existingPurchase.status !== 'completed' && data.fromWebhook) {
          const { data: updatedPurchase, error: updateError } = await supabase
            .from('purchases')
            .update({
              status: 'completed',
              updated_at: new Date().toISOString()
            })
            .eq('id', existingPurchase.id)
            .select('id')
            .single();
          
          if (updateError) {
            console.error('Error updating existing purchase:', updateError);
            return { data: null, error: updateError };
          }
          
          console.log(`Updated existing purchase ${updatedPurchase.id} to completed`);
          return { data: { id: updatedPurchase.id }, error: null };
        } else {
          console.log(`Purchase ${existingPurchase.id} already exists, no update needed`);
          return { data: { id: existingPurchase.id }, error: null };
        }
      }
      
      // First get the lesson to get creator_id
      const { data: lesson, error: lessonError } = await supabase
        .from('lessons')
        .select('creator_id, price')
        .eq('id', data.lessonId)
        .single();
      
      if (lessonError) {
        console.error('Error fetching lesson for purchase:', lessonError);
        return { data: null, error: lessonError };
      }
      
      // Use the provided amount or fall back to the lesson price
      const amount = data.amount || lesson.price;
      
      // Calculate platform fee (10% of amount)
      const platformFee = Math.round(amount * 0.1 * 100) / 100;
      const creatorEarnings = Math.round((amount - platformFee) * 100) / 100;
      
      // Generate a UUID for the purchase
      const purchaseId = crypto.randomUUID();
      
      // Set initial status - if coming from webhook, set to completed
      const initialStatus = data.fromWebhook ? 'completed' : 'pending';
      
      const { data: purchaseData, error } = await supabase
        .from('purchases')
        .insert({
          id: purchaseId,
          lesson_id: data.lessonId,
          user_id: data.userId,
          creator_id: lesson.creator_id,
          amount: amount,
          platform_fee: platformFee,
          creator_earnings: creatorEarnings,
          fee_percentage: 10, // 10%
          status: initialStatus,
          stripe_session_id: data.stripeSessionId,
          payment_intent_id: data.paymentIntentId || data.stripeSessionId, // Use provided payment intent or session ID
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          version: 1,
          metadata: {
            created_via: data.fromWebhook ? 'webhook' : 'web_checkout'
          }
        })
        .select('id')
        .single();
      
      if (error) {
        console.error('Error creating purchase:', error);
        return { data: null, error };
      }
      
      return { data: { id: purchaseData.id }, error: null };
    });
  }
  
  /**
   * Update a purchase status
   */
  async updatePurchaseStatus(
    stripeSessionId: string, 
    status: PurchaseStatus
  ): Promise<DatabaseResponse<{ id: string }>> {
    return this.executeWithRetry(async () => {
      const supabase = this.getClient();
      
      console.log(`Updating purchase status for session ${stripeSessionId} to ${status}`);
      
      // Try multiple approaches to find the purchase
      
      // 1. First try by stripe_session_id
      let { data: existingPurchase, error: fetchError } = await supabase
        .from('purchases')
        .select('id, user_id, lesson_id, status')
        .eq('stripe_session_id', stripeSessionId)
        .limit(1);
      
      // 2. If not found, try by payment_intent_id
      if (fetchError || !existingPurchase || existingPurchase.length === 0) {
        console.log(`No purchase found for session ID ${stripeSessionId}, checking payment_intent_id`);
        
        const { data: purchaseByPaymentIntent, error: paymentIntentError } = await supabase
          .from('purchases')
          .select('id, user_id, lesson_id, status')
          .eq('payment_intent_id', stripeSessionId)
          .limit(1);
          
        if (!paymentIntentError && purchaseByPaymentIntent && purchaseByPaymentIntent.length > 0) {
          console.log(`Found purchase by payment_intent_id: ${purchaseByPaymentIntent[0].id}`);
          existingPurchase = purchaseByPaymentIntent;
          fetchError = null;
        }
      }
      
      // If we found a purchase, update it
      if (!fetchError && existingPurchase && existingPurchase.length > 0) {
        const purchase = existingPurchase[0];
        
        // If the purchase is already in the desired status, just return success
        if (purchase.status === status) {
          console.log(`Purchase ${purchase.id} already has status ${status}`);
          return { data: { id: purchase.id }, error: null };
        }
        
        // Update the purchase status
        const { data: purchaseData, error } = await supabase
          .from('purchases')
          .update({
            status,
            updated_at: new Date().toISOString()
          })
          .eq('id', purchase.id)
          .select('id')
          .single();
        
        if (error) {
          console.error('Error updating purchase status:', error);
          return { data: null, error };
        }
        
        console.log(`Updated purchase ${purchaseData.id} status to ${status}`);
        return { data: { id: purchaseData.id }, error: null };
      }
      
      // If we get here, we couldn't find the purchase
      console.error('Could not find purchase to update for session/payment ID:', stripeSessionId);
      return { 
        data: null, 
        error: new Error(`No purchase found for session/payment ID: ${stripeSessionId}`) 
      };
    });
  }
  
  /**
   * Get purchases by user ID
   */
  async getPurchasesByUserId(userId: string): Promise<DatabaseResponse<{
    id: string;
    lessonId: string;
    status: PurchaseStatus;
    amount: number;
    createdAt: string;
  }[]>> {
    return this.executeWithRetry(async () => {
      const supabase = this.getClient();
      
      const { data, error } = await supabase
        .from('purchases')
        .select(`
          id,
          lesson_id,
          status,
          amount,
          created_at
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) {
        return { data: null, error };
      }
      
      const purchases = data.map(purchase => ({
        id: purchase.id,
        lessonId: purchase.lesson_id,
        status: purchase.status as PurchaseStatus,
        amount: purchase.amount,
        createdAt: purchase.created_at
      }));
      
      return { data: purchases, error: null };
    });
  }
}

// Create a singleton instance
export const purchasesService = new PurchasesService();
