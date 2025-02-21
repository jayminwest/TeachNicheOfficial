export type PurchaseStatus = 'pending' | 'completed' | 'failed' | 'refunded'

export interface LessonAccess {
  hasAccess: boolean
  purchaseStatus: PurchaseStatus | 'none'
  purchaseDate?: string
}
