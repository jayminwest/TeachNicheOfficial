export type CreatorEarningsStatus = 'pending' | 'processed' | 'paid' | 'failed';

export interface CreatorEarnings {
  id: string;
  creator_id: string;
  payment_intent_id: string;
  amount: number;
  lesson_id: string;
  status: CreatorEarningsStatus;
  created_at: string;
  updated_at?: string;
  payout_id?: string;
}

export interface CreatorEarningsCreateData {
  creator_id: string;
  payment_intent_id: string;
  amount: number;
  lesson_id: string;
}

export interface CreatorPayoutSummary {
  totalEarnings: number;
  pendingEarnings: number;
  paidEarnings: number;
  totalLessons: number;
  totalPurchases: number;
}
