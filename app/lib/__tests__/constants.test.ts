import { formatPrice, calculateFees, PAYMENT_CONSTANTS } from '../constants';

describe('Price Formatting', () => {
  it('formats prices correctly with default currency', () => {
    expect(formatPrice(0)).toBe('$0.00');
    expect(formatPrice(9.99)).toBe('$9.99');
    expect(formatPrice(10)).toBe('$10.00');
    expect(formatPrice(1000)).toBe('$1,000.00');
    expect(formatPrice(1234.56)).toBe('$1,234.56');
  });

  it('handles decimal precision correctly', () => {
    expect(formatPrice(9.9)).toBe('$9.90');
    expect(formatPrice(9.999)).toBe('$10.00'); // Rounds to 2 decimal places
    expect(formatPrice(9.991)).toBe('$9.99');  // Rounds to 2 decimal places
  });

  it('supports different currencies', () => {
    expect(formatPrice(9.99, 'EUR')).toBe('€9.99');
    expect(formatPrice(9.99, 'GBP')).toBe('£9.99');
    expect(formatPrice(9.99, 'JPY')).toBe('¥10'); // JPY typically doesn't use decimal places
  });

  it('handles negative values', () => {
    expect(formatPrice(-9.99)).toBe('-$9.99');
    expect(formatPrice(-1000)).toBe('-$1,000.00');
  });
});

describe('Fee Calculations', () => {
  it('calculates fees correctly', () => {
    const result = calculateFees(100);
    
    // Platform fee should be 15%
    expect(result.platformFee).toBe(15);
    
    // Creator earnings should be 85%
    expect(result.creatorEarnings).toBe(85);
    
    // Stripe fee should be 2.9% + $0.30
    expect(result.stripeFee).toBe(100 * 0.029 + 0.30);
    
    // Total buyer cost should be lesson price + stripe fee
    expect(result.totalBuyerCost).toBe(100 + (100 * 0.029 + 0.30));
  });

  it('handles zero price', () => {
    const result = calculateFees(0);
    
    expect(result.platformFee).toBe(0);
    expect(result.creatorEarnings).toBe(0);
    expect(result.stripeFee).toBe(0.30); // Fixed fee still applies
    expect(result.totalBuyerCost).toBe(0.30);
  });

  it('handles fractional prices', () => {
    const result = calculateFees(9.99);
    
    expect(result.platformFee).toBeCloseTo(1.50, 2);
    expect(result.creatorEarnings).toBeCloseTo(8.49, 2);
    expect(result.stripeFee).toBeCloseTo(9.99 * 0.029 + 0.30, 2);
    expect(result.totalBuyerCost).toBeCloseTo(9.99 + (9.99 * 0.029 + 0.30), 2);
  });
});
