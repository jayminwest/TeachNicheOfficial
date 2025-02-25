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
export function safeNumberValue(value: any): string {
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
