/**
 * Utility functions for handling purchases and access checks
 */

/**
 * Checks if the current URL indicates a successful purchase
 * by looking for session_id or purchase=success parameters
 */
export function hasSuccessfulPurchaseParams(): boolean {
  if (typeof window === 'undefined') return false;
  
  const urlParams = new URLSearchParams(window.location.search);
  
  return (
    urlParams.get('purchase') === 'success' ||
    urlParams.has('session_id')
  );
}

/**
 * Removes purchase success parameters from the URL
 * to prevent issues on page refresh
 */
export function cleanPurchaseParams(): void {
  if (typeof window === 'undefined') return;
  
  const url = new URL(window.location.href);
  if (url.searchParams.has('purchase')) {
    url.searchParams.delete('purchase');
  }
  if (url.searchParams.has('session_id')) {
    url.searchParams.delete('session_id');
  }
  
  window.history.replaceState({}, '', url.toString());
}
