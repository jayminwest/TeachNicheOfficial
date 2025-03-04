import { DatabaseService, DatabaseResponse } from './databaseService'

export type PurchaseStatus = 'pending' | 'completed' | 'failed' | 'refunded' | 'none';

export interface LessonAccess {
  hasAccess: boolean;
  purchaseStatus: PurchaseStatus;
  purchaseDate?: string;
}

interface PurchaseCreateData {
  lessonId: string;
  userId: string;
  amount: number;
  stripeSessionId: string;
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
        .select('price, instructor_id')
        .eq('id', lessonId)
        .single();
      
      if (lessonError) {
        return { data: null, error: lessonError };
      }
      
      // If the lesson is free or the user is the instructor, they have access
      if (lessonData.price === 0 || lessonData.instructor_id === userId) {
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
        .limit(1)
        .single();
      
      // If no purchase found, user doesn't have access
      if (purchaseError && purchaseError.code === 'PGRST116') {
        return { 
          data: { 
            hasAccess: false, 
            purchaseStatus: 'none' 
          }, 
          error: null 
        };
      }
      
      if (purchaseError) {
        return { data: null, error: purchaseError };
      }
      
      // Determine access based on purchase status
      const hasAccess = purchaseData.status === 'completed';
      
      return { 
        data: { 
          hasAccess, 
          purchaseStatus: purchaseData.status as PurchaseStatus,
          purchaseDate: purchaseData.created_at
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
      
      const { data: purchaseData, error } = await supabase
        .from('purchases')
        .update({
          status,
          updated_at: new Date().toISOString()
        })
        .eq('stripe_session_id', stripeSessionId)
        .select('id')
        .single();
      
      if (error) {
        return { data: null, error };
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
