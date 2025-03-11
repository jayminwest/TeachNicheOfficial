import { formatCurrency, formatDate } from '../format';

describe('formatCurrency', () => {
  it('should format currency with default USD', () => {
    expect(formatCurrency(10)).toBe('$10.00');
    expect(formatCurrency(10.5)).toBe('$10.50');
    expect(formatCurrency(10.555)).toBe('$10.56'); // Should round to 2 decimal places
    expect(formatCurrency(1000)).toBe('$1,000.00'); // Should include thousands separator
    expect(formatCurrency(0)).toBe('$0.00');
    expect(formatCurrency(-10)).toBe('-$10.00'); // Should handle negative values
  });

  it('should format currency with specified currency code', () => {
    expect(formatCurrency(10, 'EUR')).toBe('€10.00');
    expect(formatCurrency(10, 'GBP')).toBe('£10.00');
    expect(formatCurrency(10, 'JPY')).toBe('¥10.00');
  });
});

describe('formatDate', () => {
  it('should format date string into localized format', () => {
    // Test with a fixed date string
    expect(formatDate('2025-03-07T12:00:00Z')).toBe('March 7, 2025');
    expect(formatDate('2024-01-15')).toBe('January 15, 2024');
    expect(formatDate('2023-12-31T23:59:59')).toBe('December 31, 2023');
  });

  it('should handle different date formats', () => {
    // Test ISO format
    expect(formatDate('2025-03-07')).toBe('March 7, 2025');
    
    // Test with time component
    expect(formatDate('2025-03-07T15:30:45')).toBe('March 7, 2025');
    
    // Test with timezone
    expect(formatDate('2025-03-07T15:30:45+00:00')).toBe('March 7, 2025');
  });

  it('should handle edge cases', () => {
    // Test leap year
    expect(formatDate('2024-02-29')).toBe('February 29, 2024');
    
    // Test month boundaries
    expect(formatDate('2025-01-01')).toBe('January 1, 2025');
    expect(formatDate('2025-12-31')).toBe('December 31, 2025');
  });
});
