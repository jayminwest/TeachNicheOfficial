import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Safely converts a value to a string for use in form inputs
 * Prevents "Received NaN for the `value` attribute" errors
 * 
 * @param value Any value that might be used in a form input
 * @returns A string representation of the value, or empty string for null/undefined/NaN
 */
export function safeNumberValue(value: number | string | null | undefined): string {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return ''; // Return empty string instead of NaN
  }
  return String(value); // Cast valid numbers to string
}

export const calculateFees = (amount: number) => {
  const platformFeePercent = Number(process.env.STRIPE_PLATFORM_FEE_PERCENT || '15');
  const platformFee = Math.round(amount * (platformFeePercent / 100));
  const creatorEarnings = amount - platformFee;
  
  return {
    platformFee,
    creatorEarnings,
    feePercentage: platformFeePercent
  };
};

/**
 * Retry a function multiple times with exponential backoff
 * 
 * @param fn The async function to retry
 * @param retries Maximum number of retries
 * @param baseDelay Base delay in milliseconds
 * @param onRetry Optional callback for each retry attempt
 * @returns The result of the function
 * @throws The last error encountered
 */
export async function retry<T>(
  fn: () => Promise<T>,
  retries = 3,
  baseDelay = 1000,
  onRetry?: (error: Error, attempt: number) => void
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (onRetry) {
        onRetry(lastError, attempt + 1);
      }
      
      if (attempt < retries - 1) {
        // Exponential backoff with jitter
        const delay = baseDelay * Math.pow(2, attempt) * (0.5 + Math.random() * 0.5);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError!;
}
