/**
 * Health Check API Route
 * 
 * This API route performs a comprehensive health check of all services
 * and environment variables. It can be used to verify the application
 * is properly configured before deployment.
 */

import { NextResponse } from 'next/server';
import { validateEnvironment } from '../../../lib/env-validation';

export async function GET(request: Request) {
  try {
    // Check if this is a production environment
    const isProduction = process.env.NODE_ENV === 'production';
    
    // In production, require an API key for security
    if (isProduction) {
      const url = new URL(request.url);
      const apiKey = url.searchParams.get('api_key');
      const validApiKey = process.env.HEALTH_CHECK_API_KEY;
      
      if (!apiKey || apiKey !== validApiKey) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }
    
    // Perform the environment validation
    let results;
    try {
      results = await validateEnvironment();
    } catch (validationError) {
      console.error('Environment validation error:', validationError);
      return NextResponse.json({
        status: 'error',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        message: validationError instanceof Error ? validationError.message : 'Environment validation failed',
        services: []
      }, {
        status: 500
      });
    }
    
    // Check if there are any errors
    const hasErrors = results.some(result => result.status === 'error');
    
    // Return the results
    return NextResponse.json({
      status: hasErrors ? 'error' : 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      services: results
    }, {
      status: hasErrors ? 500 : 200
    });
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      message: error instanceof Error ? error.message : 'Unknown error',
      services: []
    }, {
      status: 500
    });
  }
}
