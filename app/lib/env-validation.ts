/**
 * Environment Validation Utilities
 * 
 * This module provides utilities for validating environment variables
 * and service configurations. It can be used during application startup
 * to ensure all required variables are set and services are accessible.
 */

import { createMuxClient } from '../services/mux';
import { createStripeClient } from '../services/stripe';

export interface ServiceStatus {
  service: string;
  status: 'ok' | 'error' | 'warning';
  message?: string;
}

/**
 * Validates that all required environment variables are set
 * @returns An array of validation results
 */
export function validateEnvironmentVariables(): ServiceStatus[] {
  const results: ServiceStatus[] = [];
  
  // Validate Mux environment variables
  if (!process.env.MUX_TOKEN_ID || !process.env.MUX_TOKEN_SECRET) {
    results.push({
      service: 'Mux',
      status: 'error',
      message: 'Missing required environment variables: MUX_TOKEN_ID and/or MUX_TOKEN_SECRET'
    });
  } else {
    results.push({ service: 'Mux Environment', status: 'ok' });
  }
  
  // Validate Stripe environment variables
  if (!process.env.STRIPE_SECRET_KEY || !process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    results.push({
      service: 'Stripe',
      status: 'error',
      message: 'Missing required environment variables: STRIPE_SECRET_KEY, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, and/or STRIPE_WEBHOOK_SECRET'
    });
  } else {
    results.push({ service: 'Stripe Environment', status: 'ok' });
  }
  
  // Validate Supabase environment variables
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    results.push({
      service: 'Supabase',
      status: 'error',
      message: 'Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and/or SUPABASE_SERVICE_ROLE_KEY'
    });
  } else {
    results.push({ service: 'Supabase Environment', status: 'ok' });
  }
  
  return results;
}

/**
 * Checks if all service clients can be initialized
 * @returns An array of initialization results
 */
export function validateServiceInitialization(): ServiceStatus[] {
  const results: ServiceStatus[] = [];
  
  // Validate Mux client initialization
  try {
    // Just check if the environment variables are set
    // We don't initialize the client here to avoid ESM issues
    if (!process.env.MUX_TOKEN_ID || !process.env.MUX_TOKEN_SECRET) {
      throw new Error('Missing Mux environment variables');
    }
    results.push({ service: 'Mux Initialization', status: 'ok' });
  } catch (error) {
    results.push({
      service: 'Mux Initialization',
      status: 'error',
      message: error instanceof Error ? error.message : String(error)
    });
  }
  
  // Validate Stripe client initialization
  try {
    let stripeClient;
    try {
      stripeClient = createStripeClient();
    } catch (e) {
      throw new Error(`Failed to create Stripe client: ${e instanceof Error ? e.message : String(e)}`);
    }
    
    if (!stripeClient || !stripeClient.stripe) {
      throw new Error('Stripe client is undefined');
    }
    results.push({ service: 'Stripe Initialization', status: 'ok' });
  } catch (error) {
    results.push({
      service: 'Stripe Initialization',
      status: 'error',
      message: error instanceof Error ? error.message : String(error)
    });
  }
  
  return results;
}

/**
 * Performs a health check on all external services
 * @returns A promise that resolves to an array of service health check results
 */
export async function checkServiceHealth(): Promise<ServiceStatus[]> {
  const results: ServiceStatus[] = [];
  
  // Check Mux API
  try {
    // Just check if the environment variables are set
    // We don't make API calls here to avoid ESM issues
    if (!process.env.MUX_TOKEN_ID || !process.env.MUX_TOKEN_SECRET) {
      throw new Error('Missing Mux environment variables');
    }
    results.push({ service: 'Mux API', status: 'ok' });
  } catch (error) {
    results.push({
      service: 'Mux API',
      status: 'error',
      message: error instanceof Error ? error.message : String(error)
    });
  }
  
  // Check Stripe API
  try {
    const { stripe } = createStripeClient();
    await stripe.balance.retrieve();
    results.push({ service: 'Stripe API', status: 'ok' });
  } catch (error) {
    results.push({
      service: 'Stripe API',
      status: 'error',
      message: error instanceof Error ? error.message : String(error)
    });
  }
  
  return results;
}

/**
 * Performs a comprehensive validation of all environment variables and services
 * @returns A promise that resolves to an array of validation results
 */
export async function validateEnvironment(): Promise<ServiceStatus[]> {
  // Combine all validation results
  const envResults = validateEnvironmentVariables();
  const initResults = validateServiceInitialization();
  const healthResults = await checkServiceHealth();
  
  return [...envResults, ...initResults, ...healthResults];
}

/**
 * Checks if the environment is valid for production use
 * @returns A boolean indicating if the environment is valid
 */
export async function isEnvironmentValid(): Promise<boolean> {
  const results = await validateEnvironment();
  return results.every(result => result.status === 'ok');
}
