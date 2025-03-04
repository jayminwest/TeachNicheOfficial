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
        amount: amount,
        sessionId: data.stripeSessionId,
        fromWebhook: data.fromWebhook
      });
      
      // Check if a purchase record already exists with this session ID
      const { data: existingPurchase, error: checkError } = await supabase
        .from('purchases')
        .select('id, status')
        .eq('stripe_session_id', data.stripeSessionId)
        .limit(1);
      
      if (!checkError && existingPurchase && existingPurchase.length > 0) {
        console.log(`Purchase already exists with session ID ${data.stripeSessionId}, status: ${existingPurchase[0].status}`);
        
        // Only update if not already completed
        if (existingPurchase[0].status !== 'completed') {
          // Update the status to completed if it exists
          const { data: updatedPurchase, error: updateError } = await supabase
            .from('purchases')
            .update({
              status: 'completed',
              updated_at: new Date().toISOString()
            })
            .eq('id', existingPurchase[0].id)
            .select('id')
            .single();
          
          if (updateError) {
            console.error('Error updating existing purchase:', updateError);
            return { data: null, error: updateError };
          }
          
          console.log(`Updated existing purchase ${updatedPurchase.id} to completed`);
          return { data: { id: updatedPurchase.id }, error: null };
        } else {
          console.log(`Purchase ${existingPurchase[0].id} already completed, no update needed`);
          return { data: { id: existingPurchase[0].id }, error: null };
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
          amount: data.amount,
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
