import { cookies } from 'next/headers';

/**
 * Helper functions for cookie management in authentication flows
 */

/**
 * Get a cookie value by name
 * @param name The name of the cookie to retrieve
 * @returns The cookie value or null if not found
 */
export async function getCookie(name: string): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const cookie = cookieStore.get(name);
    return cookie?.value || null;
  } catch (error) {
    console.warn(`Error getting cookie ${name}:`, error);
    return null;
  }
}

/**
 * Set a cookie with the given name and value
 * @param name The name of the cookie
 * @param value The value to store
 * @param options Optional cookie options
 */
export async function setCookie(
  name: string, 
  value: string, 
  options: { 
    maxAge?: number; 
    path?: string; 
    secure?: boolean; 
    httpOnly?: boolean;
  } = {}
): Promise<void> {
  try {
    const cookieStore = await cookies();
    cookieStore.set(name, value, options);
  } catch (error) {
    console.warn(`Error setting cookie ${name}:`, error);
  }
}

/**
 * Delete a cookie by name
 * @param name The name of the cookie to delete
 */
export async function deleteCookie(name: string): Promise<void> {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(name);
  } catch (error) {
    console.warn(`Error deleting cookie ${name}:`, error);
  }
}
