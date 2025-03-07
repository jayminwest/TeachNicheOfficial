import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { 
  hasSuccessfulPurchaseParams, 
  cleanPurchaseParams, 
  getRedirectUrl,
  addRedirectParam
} from '../purchase-helpers';

// Mock window.location
const originalLocation = window.location;

beforeEach(() => {
  // Mock window.location
  delete window.location;
  window.location = {
    ...originalLocation,
    href: 'https://example.com',
    search: '',
    origin: 'https://example.com',
  } as unknown as Location;
});

afterEach(() => {
  // Restore window.location
  window.location = originalLocation;
});

describe('Purchase Helper Functions', () => {
  describe('hasSuccessfulPurchaseParams', () => {
    it('returns false when no purchase params exist', () => {
      window.location.search = '';
      expect(hasSuccessfulPurchaseParams()).toBe(false);
    });

    it('returns true when purchase=success param exists', () => {
      window.location.search = '?purchase=success';
      expect(hasSuccessfulPurchaseParams()).toBe(true);
    });

    it('returns true when session_id param exists', () => {
      window.location.search = '?session_id=cs_test_123';
      expect(hasSuccessfulPurchaseParams()).toBe(true);
    });

    it('returns true when both params exist', () => {
      window.location.search = '?purchase=success&session_id=cs_test_123';
      expect(hasSuccessfulPurchaseParams()).toBe(true);
    });
  });

  describe('cleanPurchaseParams', () => {
    it('removes purchase param from URL', () => {
      window.location.href = 'https://example.com?purchase=success';
      window.location.search = '?purchase=success';
      
      const replaceStateSpy = jest.spyOn(window.history, 'replaceState');
      
      cleanPurchaseParams();
      
      expect(replaceStateSpy).toHaveBeenCalledWith(
        {},
        '',
        'https://example.com'
      );
    });

    it('removes session_id param from URL', () => {
      window.location.href = 'https://example.com?session_id=cs_test_123';
      window.location.search = '?session_id=cs_test_123';
      
      const replaceStateSpy = jest.spyOn(window.history, 'replaceState');
      
      cleanPurchaseParams();
      
      expect(replaceStateSpy).toHaveBeenCalledWith(
        {},
        '',
        'https://example.com'
      );
    });

    it('removes both params while preserving other params', () => {
      window.location.href = 'https://example.com?purchase=success&session_id=cs_test_123&other=value';
      window.location.search = '?purchase=success&session_id=cs_test_123&other=value';
      
      const replaceStateSpy = jest.spyOn(window.history, 'replaceState');
      
      cleanPurchaseParams();
      
      expect(replaceStateSpy).toHaveBeenCalledWith(
        {},
        '',
        'https://example.com?other=value'
      );
    });
  });

  describe('getRedirectUrl', () => {
    it('returns null when no redirect param exists', () => {
      window.location.search = '';
      expect(getRedirectUrl()).toBeNull();
    });

    it('returns the redirect URL when param exists', () => {
      window.location.search = '?redirect=/lessons/123';
      expect(getRedirectUrl()).toBe('/lessons/123');
    });

    it('returns the redirect URL with other params present', () => {
      window.location.search = '?other=value&redirect=/lessons/123';
      expect(getRedirectUrl()).toBe('/lessons/123');
    });
  });

  describe('addRedirectParam', () => {
    it('adds redirect param to URL without existing params', () => {
      const result = addRedirectParam('/auth/signin', '/lessons/123');
      expect(result).toBe('https://example.com/auth/signin?redirect=%2Flessons%2F123');
    });

    it('adds redirect param to URL with existing params', () => {
      const result = addRedirectParam('/auth/signin?other=value', '/lessons/123');
      expect(result).toBe('https://example.com/auth/signin?other=value&redirect=%2Flessons%2F123');
    });

    it('replaces existing redirect param', () => {
      const result = addRedirectParam('/auth/signin?redirect=/old-path', '/lessons/123');
      expect(result).toBe('https://example.com/auth/signin?redirect=%2Flessons%2F123');
    });
  });
});
