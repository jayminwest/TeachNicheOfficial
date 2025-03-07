import { cookies } from 'next/headers';

/**
 * Helper functions for cookie management in authentication flows
 */

/**
 * Get a cookie value by name
 * @param name The name of the cookie to retrieve
 * @returns The cookie value or null if not found
 */
export function getCookie(name: string): string | null {
  const cookieStore = cookies();
  const cookie = cookieStore.get(name);
  return cookie?.value || null;
}

/**
 * Set a cookie with the given name and value
 * @param name The name of the cookie
 * @param value The value to store
 * @param options Optional cookie options
 */
export function setCookie(
  name: string, 
  value: string, 
  options: { 
    maxAge?: number; 
    path?: string; 
    secure?: boolean; 
    httpOnly?: boolean;
  } = {}
): void {
  const cookieStore = cookies();
  cookieStore.set(name, value, options);
}

/**
 * Delete a cookie by name
 * @param name The name of the cookie to delete
 */
export function deleteCookie(name: string): void {
  const cookieStore = cookies();
  cookieStore.delete(name);
}
