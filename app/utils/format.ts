/**
 * Formats a number as currency
 * @param amount The amount to format
 * @param currency The currency code (default: USD)
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Formats a date string into a localized date format
 * @param dateString The date string to format
 * @returns Formatted date string (e.g., "March 7, 2025")
 */
export function formatDate(dateString: string): string {
  // Create a date object with explicit UTC handling to avoid timezone issues
  const [year, month, day] = dateString.split('T')[0].split('-').map(Number);
  
  // Month is 0-indexed in JavaScript Date
  const date = new Date(Date.UTC(year, month - 1, day));
  
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
}
