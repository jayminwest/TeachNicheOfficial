import { DatabaseService, DatabaseResponse } from './databaseService'
import { PurchaseStatus, LessonAccess, PurchaseCreateData, Purchase } from '@/types/purchase'

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
      
      const { data: purchaseData, error } = await supabase
        .from('purchases')
        .insert({
          lesson_id: data.lessonId,
          user_id: data.userId,
          amount: data.amount,
          status: 'pending',
          stripe_session_id: data.stripeSessionId,
          created_at: new Date().toISOString()
        })
        .select('id')
        .single();
      
      if (error) {
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
      
      // First, get the purchase to ensure it exists
      const { data: existingPurchase, error: fetchError } = await supabase
        .from('purchases')
        .select('id, user_id, lesson_id')
        .eq('stripe_session_id', stripeSessionId)
        .single();
      
      if (fetchError) {
        console.error('Error fetching purchase:', fetchError);
        return { data: null, error: fetchError };
      }
      
      // Update the purchase status
      const { data: purchaseData, error } = await supabase
        .from('purchases')
        .update({
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingPurchase.id)
        .select('id')
        .single();
      
      if (error) {
        console.error('Error updating purchase status:', error);
        return { data: null, error };
      }
      
      // Clear any cached access data for this user and lesson
      try {
        // This is a server-side operation, so we can't directly access sessionStorage
        // Instead, we'll rely on the client to clear its cache when it sees the success parameter
        console.log(`Updated purchase ${purchaseData.id} status to ${status}`);
      } catch (err) {
        console.error('Error clearing cache:', err);
      }
      
      return { data: { id: purchaseData.id }, error: null };
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
