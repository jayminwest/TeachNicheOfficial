import React from 'react';
import { calculateGrossAmount, calculateFeeAmount } from '@/app/services/stripe';
import { cn } from '@/app/lib/utils';

interface PriceBreakdownProps {
  basePrice: number;
  showDetails?: boolean;
  className?: string;
  compact?: boolean;
}

export function PriceBreakdown({ 
  basePrice, 
  showDetails = true, 
  className,
  compact = false
}: PriceBreakdownProps) {
  const processingFee = calculateFeeAmount(basePrice);
  const totalPrice = calculateGrossAmount(basePrice);
  
  if (!showDetails || compact) {
    return (
      <div className={cn("flex flex-col", className)}>
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Total</span>
          <span className="font-medium">${totalPrice.toFixed(2)}</span>
        </div>
        {compact && showDetails && (
          <div className="text-xs text-muted-foreground mt-1">
            Includes ${processingFee.toFixed(2)} processing fee
          </div>
        )}
      </div>
    );
  }
  
  return (
    <div className={cn("flex flex-col space-y-2", className)}>
      <div className="flex justify-between items-center">
        <span className="text-sm">Base price</span>
        <span>${basePrice.toFixed(2)}</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-sm text-muted-foreground">Processing fee</span>
        <span className="text-muted-foreground">${processingFee.toFixed(2)}</span>
      </div>
      <div className="border-t pt-2 mt-1 flex justify-between items-center">
        <span className="font-medium">Total</span>
        <span className="font-medium">${totalPrice.toFixed(2)}</span>
      </div>
    </div>
  );
}
