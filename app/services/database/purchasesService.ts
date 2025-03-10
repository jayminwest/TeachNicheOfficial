import { DatabaseService, DatabaseResponse } from './DatabaseService';
import Stripe from 'stripe';
import { PurchaseStatus } from '@/app/types/purchase';

// Create a singleton instance
const purchasesServiceInstance = new PurchasesService();
export { purchasesServiceInstance as purchasesService };

/**
 * Data required to create a purchase record
 */
export interface PurchaseCreateData {
  lessonId: string;
  userId: string;
  amount: number;
  stripeSessionId: string;
  paymentIntentId?: string;
  fromWebhook?: boolean;
}

/**
 * Response from verifying a Stripe session
 */
export interface StripeVerificationResult {
  isPaid: boolean;
  amount: number;
  lessonId: string;
  userId: string;
}

/**
 * Response from checking lesson access
 */
export interface LessonAccessResult {
  hasAccess: boolean;
  purchaseStatus: PurchaseStatus;
  purchaseDate?: string;
}

/**
 * Formatted purchase record for client use
 */
export interface FormattedPurchase {
  id: string;
  lessonId: string;
  status: string;
  amount: number;
  createdAt: string;
}

/**
 * Service for managing purchase-related database operations
 */
export class PurchasesService extends DatabaseService {
  private stripeInstance: Stripe | null = null;
  private readonly PLATFORM_FEE_PERCENTAGE = 0.15; // 15%

  /**
   * Get or initialize the Stripe instance
   */
  protected async getStripe(): Promise<Stripe> {
    if (!this.stripeInstance) {
      const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
      if (!stripeSecretKey) {
        throw new Error('STRIPE_SECRET_KEY is not defined');
      }
      
      this.stripeInstance = new Stripe(stripeSecretKey, {
        apiVersion: '2025-01-27.acacia',
      });
    }
    
    return this.stripeInstance;
  }

  /**
   * Verify a Stripe checkout session
   * @param sessionId The Stripe session ID to verify
   */
  async verifyStripeSession(sessionId: string): Promise<DatabaseResponse<StripeVerificationResult>> {
    try {
      const stripe = await this.getStripe();
      const session = await stripe.checkout.sessions.retrieve(
        sessionId,
        { expand: ['line_items', 'payment_intent'] }
      );
      
      if (!session) {
        return this.formatError(
          new Error('Session not found'),
          'Error verifying Stripe session'
        );
      }
      
      // Check if payment is successful
      const isPaid = session.payment_status === 'paid' || 
                     session.payment_status === 'no_payment_required';
      
      // Convert amount from cents to dollars
      const amount = (session.amount_total || 0) / 100;
      
      // Extract lesson and user IDs from metadata or client_reference_id
      let lessonId = session.metadata?.lessonId;
      let userId = session.metadata?.userId;
      
      // If metadata is missing, try to extract from client_reference_id
      if ((!lessonId || !userId) && session.client_reference_id) {
        const refIdMatch = session.client_reference_id.match(/lesson_([^_]+)_user_([^_]+)/);
        if (refIdMatch) {
          lessonId = refIdMatch[1];
          userId = refIdMatch[2];
        }
      }
      
      if (!lessonId || !userId) {
        return this.formatError(
          new Error('Missing lesson or user ID in session'),
          'Error verifying Stripe session'
        );
      }
      
      return {
        data: {
          isPaid,
          amount,
          lessonId,
          userId
        },
        error: null,
        success: true
      };
    } catch (error) {
      return this.formatError(
        error,
        'Error verifying Stripe session'
      );
    }
  }

  /**
   * Check if a user has access to a lesson
   * @param userId The user ID
   * @param lessonId The lesson ID
   */
  async checkLessonAccess(userId: string, lessonId: string): Promise<DatabaseResponse<LessonAccessResult>> {
    try {
      // Get lesson details to check price and creator
      const { data: lesson, error: lessonError } = await this.supabase
        .from('lessons')
        .select('price, creator_id')
        .eq('id', lessonId)
        .single();
      
      if (lessonError) {
        throw new Error(`Error fetching lesson: ${lessonError.message}`);
      }
      
      if (!lesson) {
        throw new Error('Lesson not found');
      }
      
      // Free lessons are accessible to everyone
      if (lesson.price === 0) {
        return {
          data: {
            hasAccess: true,
            purchaseStatus: 'none'
          },
          error: null,
          success: true
        };
      }
      
      // Creators always have access to their own lessons
      if (lesson.creator_id === userId) {
        return {
          data: {
            hasAccess: true,
            purchaseStatus: 'none'
          },
          error: null,
          success: true
        };
      }
      
      // Check if user has purchased this lesson
      const { data: purchases, error: purchasesError } = await this.supabase
        .from('purchases')
        .select('status, created_at')
        .eq('user_id', userId)
        .eq('lesson_id', lessonId)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (purchasesError) {
        throw new Error(`Error fetching purchases: ${purchasesError.message}`);
      }
      
      // No purchases found
      if (!purchases || purchases.length === 0) {
        return {
          data: {
            hasAccess: false,
            purchaseStatus: 'none'
          },
          error: null,
          success: true
        };
      }
      
      const latestPurchase = purchases[0];
      const hasAccess = latestPurchase.status === 'completed';
      
      return {
        data: {
          hasAccess,
          purchaseStatus: latestPurchase.status as PurchaseStatus,
          purchaseDate: latestPurchase.created_at
        },
        error: null,
        success: true
      };
    } catch (error) {
      return this.formatError(
        error,
        'Error checking lesson access'
      );
    }
  }

  /**
   * Create a purchase record
   * @param data The purchase data
   */
  async createPurchase(data: PurchaseCreateData): Promise<DatabaseResponse<{ id: string }>> {
    try {
      // Check if user already has a completed purchase for this lesson
      const { data: existingPurchases, error: existingError } = await this.supabase
        .from('purchases')
        .select('id, status')
        .eq('user_id', data.userId)
        .eq('lesson_id', data.lessonId)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (existingError) {
        throw new Error(`Error checking existing purchases: ${existingError.message}`);
      }
      
      // If user already has a completed purchase, return it
      if (existingPurchases && existingPurchases.length > 0 && existingPurchases[0].status === 'completed') {
        return {
          data: { id: existingPurchases[0].id },
          error: null,
          success: true
        };
      }
      
      // Check if there's an existing purchase with the same session ID
      const { data: sessionPurchases, error: sessionError } = await this.supabase
        .from('purchases')
        .select('id, status')
        .eq('stripe_session_id', data.stripeSessionId)
        .limit(1);
      
      if (sessionError) {
        throw new Error(`Error checking session purchases: ${sessionError.message}`);
      }
      
      // If there's an existing purchase with this session ID, update it if needed
      if (sessionPurchases && sessionPurchases.length > 0) {
        const existingPurchase = sessionPurchases[0];
        
        // If the purchase is already completed or we're not processing from a webhook, just return it
        if (existingPurchase.status === 'completed' || !data.fromWebhook) {
          return {
            data: { id: existingPurchase.id },
            error: null,
            success: true
          };
        }
        
        // Update the existing purchase
        const { data: updatedPurchase, error: updateError } = await this.supabase
          .from('purchases')
          .update({
            status: 'completed',
            updated_at: new Date().toISOString()
          })
          .eq('id', existingPurchase.id)
          .select()
          .single();
        
        if (updateError) {
          throw new Error(`Error updating purchase: ${updateError.message}`);
        }
        
        return {
          data: { id: updatedPurchase.id },
          error: null,
          success: true
        };
      }
      
      // Get lesson details to get creator ID
      const { data: lesson, error: lessonError } = await this.supabase
        .from('lessons')
        .select('creator_id, price')
        .eq('id', data.lessonId)
        .single();
      
      if (lessonError) {
        throw new Error(`Error fetching lesson: ${lessonError.message}`);
      }
      
      if (!lesson) {
        throw new Error('Lesson not found');
      }
      
      // Calculate fees
      const platformFee = data.amount * this.PLATFORM_FEE_PERCENTAGE;
      const creatorEarnings = data.amount - platformFee;
      
      // Create a new purchase record
      const purchaseId = crypto.randomUUID();
      const { data: newPurchase, error: insertError } = await this.supabase
        .from('purchases')
        .insert({
          id: purchaseId,
          user_id: data.userId,
          lesson_id: data.lessonId,
          creator_id: lesson.creator_id,
          amount: data.amount,
          platform_fee: platformFee,
          creator_earnings: creatorEarnings,
          fee_percentage: this.PLATFORM_FEE_PERCENTAGE,
          stripe_session_id: data.stripeSessionId,
          payment_intent_id: data.paymentIntentId,
          status: data.fromWebhook ? 'completed' : 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (insertError) {
        throw new Error(`Error creating purchase: ${insertError.message}`);
      }
      
      return {
        data: { id: newPurchase.id },
        error: null,
        success: true
      };
    } catch (error) {
      return this.formatError(
        error,
        'Error creating purchase'
      );
    }
  }

  /**
   * Update the status of a purchase
   * @param referenceId The Stripe session ID or payment intent ID
   * @param status The new status
   */
  async updatePurchaseStatus(
    referenceId: string, 
    status: PurchaseStatus
  ): Promise<DatabaseResponse<{ id: string }>> {
    try {
      // Try to find purchase by session ID first
      const { data: sessionPurchases, error: sessionError } = await this.supabase
        .from('purchases')
        .select('id, status')
        .eq('stripe_session_id', referenceId)
        .limit(1);
      
      if (sessionError) {
        throw new Error(`Error finding purchase by session ID: ${sessionError.message}`);
      }
      
      let purchaseToUpdate = sessionPurchases && sessionPurchases.length > 0 
        ? sessionPurchases[0] 
        : null;
      
      // If not found by session ID, try payment intent ID
      if (!purchaseToUpdate) {
        const { data: intentPurchases, error: intentError } = await this.supabase
          .from('purchases')
          .select('id, status')
          .eq('payment_intent_id', referenceId)
          .limit(1);
        
        if (intentError) {
          throw new Error(`Error finding purchase by payment intent ID: ${intentError.message}`);
        }
        
        purchaseToUpdate = intentPurchases && intentPurchases.length > 0 
          ? intentPurchases[0] 
          : null;
      }
      
      if (!purchaseToUpdate) {
        return this.formatError(
          new Error(`No purchase found for reference ID: ${referenceId}`),
          'Error updating purchase status'
        );
      }
      
      // If status is already what we want, just return the purchase
      if (purchaseToUpdate.status === status) {
        return {
          data: { id: purchaseToUpdate.id },
          error: null,
          success: true
        };
      }
      
      // Update the purchase status
      const { data: updatedPurchase, error: updateError } = await this.supabase
        .from('purchases')
        .update({
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', purchaseToUpdate.id)
        .select()
        .single();
      
      if (updateError) {
        throw new Error(`Error updating purchase status: ${updateError.message}`);
      }
      
      return {
        data: { id: updatedPurchase.id },
        error: null,
        success: true
      };
    } catch (error) {
      return this.formatError(
        error,
        'Error updating purchase status'
      );
    }
  }

  /**
   * Get all purchases for a user
   * @param userId The user ID
   */
  async getPurchasesByUserId(userId: string): Promise<DatabaseResponse<FormattedPurchase[]>> {
    try {
      const { data: purchases, error } = await this.supabase
        .from('purchases')
        .select('id, lesson_id, status, amount, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) {
        throw new Error(`Error fetching purchases: ${error.message}`);
      }
      
      // Format purchases for client use
      const formattedPurchases: FormattedPurchase[] = purchases.map(purchase => ({
        id: purchase.id,
        lessonId: purchase.lesson_id,
        status: purchase.status,
        amount: purchase.amount,
        createdAt: purchase.created_at
      }));
      
      return {
        data: formattedPurchases,
        error: null,
        success: true
      };
    } catch (error) {
      return this.formatError(
        error,
        'Error fetching purchases'
      );
    }
  }
}
// This file re-exports the PurchasesService for compatibility with imports
// that use the lowercase naming convention
import { PurchasesService } from './PurchasesService';

export { PurchasesService };
export * from './PurchasesService';

// Create a singleton instance for use throughout the application
export const purchasesService = new PurchasesService();
