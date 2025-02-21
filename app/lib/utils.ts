import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const calculateFees = (amount: number) => {
  const platformFeePercent = Number(process.env.STRIPE_PLATFORM_FEE_PERCENT || '10');
  const platformFee = Math.round(amount * (platformFeePercent / 100));
  const creatorEarnings = amount - platformFee;
  
  return {
    platformFee,
    creatorEarnings,
    feePercentage: platformFeePercent
  };
};
