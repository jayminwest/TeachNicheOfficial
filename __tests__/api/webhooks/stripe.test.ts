/**
 * @jest-environment node
 */

import { describe, it, expect } from '@jest/globals';
import { NextResponse } from 'next/server';
import { POST } from '@/app/api/webhooks/stripe/route';

// Mock next/headers
jest.mock('next/headers', () => ({
  headers: () => ({
    get: () => null
  }),
  cookies: () => ({})
}));

describe('Stripe Webhook Handler', () => {
  it('handles missing signatures', async () => {
    const request = {
      text: () => Promise.resolve('{}')
    } as unknown as Request;

    const response = await POST(request);
    expect(response).toBeInstanceOf(NextResponse);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Missing stripe-signature header');
  });
});
