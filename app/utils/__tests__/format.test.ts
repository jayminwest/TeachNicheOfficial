import { formatCurrency } from '../format';

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
