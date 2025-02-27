/**
 * Application-wide constants
 */

/**
 * Payment model constants
 */
export const PAYMENT_CONSTANTS = {
  // Revenue sharing
  CREATOR_SHARE_PERCENTAGE: 0.85, // 85% to creator
  PLATFORM_FEE_PERCENTAGE: 0.15, // 15% to platform
  
  // Stripe fees (passed to buyer)
  STRIPE_FEE_PERCENTAGE: 0.029, // 2.9%
  STRIPE_FEE_FIXED: 0.30, // $0.30
  
  // Payout settings
  MINIMUM_PAYOUT_AMOUNT: 50, // $50 minimum for payouts
  PAYOUT_SCHEDULE: 'monthly' as const, // 'weekly' | 'monthly'
  
  // Display settings
  CURRENCY: 'USD',
  CURRENCY_SYMBOL: '$',
};

/**
 * Calculate fees for a lesson purchase
 * 
 * @param lessonPrice - The base price of the lesson in dollars
 * @returns Object containing fee breakdown and total cost
 */
export function calculateFees(lessonPrice: number) {
  const platformFee = lessonPrice * PAYMENT_CONSTANTS.PLATFORM_FEE_PERCENTAGE;
  const creatorEarnings = lessonPrice * PAYMENT_CONSTANTS.CREATOR_SHARE_PERCENTAGE;
  const stripeFee = (lessonPrice * PAYMENT_CONSTANTS.STRIPE_FEE_PERCENTAGE) + 
                    PAYMENT_CONSTANTS.STRIPE_FEE_FIXED;
  const totalBuyerCost = lessonPrice + stripeFee;
  
  return {
    lessonPrice,
    platformFee,
    creatorEarnings,
    stripeFee,
    totalBuyerCost
  };
}

/**
 * Format a price for display
 * 
 * @param amount - The amount to format
 * @param currency - The currency code (defaults to USD)
 * @returns Formatted price string
 */
export function formatPrice(amount: number, currency = PAYMENT_CONSTANTS.CURRENCY) {
  // JPY typically doesn't use decimal places
  const fractionDigits = currency === 'JPY' ? 0 : 2;
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits
  }).format(amount);
}
