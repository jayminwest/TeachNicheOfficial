import { calculateGrossAmount, calculateFeeAmount, stripeConfig } from '../stripe';

describe('Stripe Fee Calculations', () => {
  // Store original config values
  const originalPercentage = stripeConfig.processingFeePercent;
  const originalFixed = stripeConfig.processingFeeFixed;
  
  beforeEach(() => {
    // Reset to default values for tests
    stripeConfig.processingFeePercent = 2.9;
    stripeConfig.processingFeeFixed = 0.30;
  });
  
  afterAll(() => {
    // Restore original values
    stripeConfig.processingFeePercent = originalPercentage;
    stripeConfig.processingFeeFixed = originalFixed;
  });
  
  describe('calculateGrossAmount', () => {
    test('calculates correct gross amount for standard fees', () => {
      // For $10 net with 2.9% + $0.30 fee, gross should be ~$10.61
      expect(calculateGrossAmount(10)).toBeCloseTo(10.61, 2);
      
      // For $100 net with 2.9% + $0.30 fee, gross should be ~$103.30
      expect(calculateGrossAmount(100)).toBeCloseTo(103.30, 2);
      
      // For $5 net with 2.9% + $0.30 fee, gross should be ~$5.46
      expect(calculateGrossAmount(5)).toBeCloseTo(5.46, 2);
    });
    
    test('handles small amounts correctly', () => {
      // For $1 net with 2.9% + $0.30 fee, gross should be ~$1.34
      expect(calculateGrossAmount(1)).toBeCloseTo(1.34, 2);
      
      // For $0.50 net with 2.9% + $0.30 fee, gross should be ~$0.83
      expect(calculateGrossAmount(0.5)).toBeCloseTo(0.83, 2);
    });
    
    test('handles different fee configurations', () => {
      // Change to 3.5% + $0.50
      stripeConfig.processingFeePercent = 3.5;
      stripeConfig.processingFeeFixed = 0.50;
      
      // For $10 net with 3.5% + $0.50 fee, gross should be ~$10.89
      expect(calculateGrossAmount(10)).toBeCloseTo(10.89, 2);
    });
  });
  
  describe('calculateFeeAmount', () => {
    test('calculates correct fee amount', () => {
      // For $10 base price, fee should be ~$0.61
      expect(calculateFeeAmount(10)).toBeCloseTo(0.61, 2);
      
      // For $100 base price, fee should be ~$3.30
      expect(calculateFeeAmount(100)).toBeCloseTo(3.30, 2);
    });
    
    test('handles small amounts correctly', () => {
      // For $1 base price, fee should be ~$0.35
      expect(calculateFeeAmount(1)).toBeCloseTo(0.35, 2);
    });
  });
});
