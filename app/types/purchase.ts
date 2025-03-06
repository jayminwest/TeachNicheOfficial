export type PurchaseStatus = 'pending' | 'completed' | 'failed' | 'refunded' | 'none';

export interface LessonAccess {
  hasAccess: boolean;
  purchaseStatus: PurchaseStatus;
  purchaseDate?: string;
}

export interface PurchaseCreateData {
  lessonId: string;
  userId: string;
  amount: number;
  stripeSessionId: string;
  paymentIntentId?: string;
  fromWebhook?: boolean;
}

export interface Purchase {
  id: string;
  lessonId: string;
  status: PurchaseStatus;
  amount: number;
  createdAt: string;
}

// These types are already defined above, no need to re-export
