import { NextResponse } from 'next/server'
import { lessonRequestSchema } from '@/app/lib/schemas/lesson-request'
import { getAuth, User } from 'firebase/auth'
import { getApp } from 'firebase/app'
import { firebaseClient } from '@/app/services/firebase-compat'

export async function POST(request: Request) {
  try {
    // Get the current user using the route handler client
    const user = await new Promise<User | null>(resolve => {
      const auth = getAuth(getApp());
      const unsubscribe = auth.onAuthStateChanged(user => {
        unsubscribe();
        resolve(user);
      });
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    
    // Validate request body
    const validatedData = lessonRequestSchema.parse(body)

    const { data, error } = await firebaseClient
      .from('lesson_requests')
      .insert({ 
        ...validatedData,
        user_id: user.uid,
        status: 'open',
        vote_count: 0,
        created_at: new Date().toISOString()
      })

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to create request' },
        { status: 400 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error creating request:', error)
    return NextResponse.json(
      { error: 'Failed to create request' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    
    const category = searchParams.get('category')
    const status = searchParams.get('status')
    
    // Define a type for the query builder
    type QueryBuilder = {
      eq: (field: string, value: string | boolean | number) => QueryBuilder;
      order: (field: string, options: { ascending: boolean }) => QueryBuilder;
      get: () => Promise<{ 
        data: Array<Record<string, unknown>>; 
        error: Error | null | unknown 
      }>;
    };
    
    // Create a query builder
    let queryBuilder = firebaseClient
      .from('lesson_requests')
      .select() as unknown as QueryBuilder;
    
    // Apply filters
    if (category) {
      queryBuilder = queryBuilder.eq('category', category);
    }
    if (status) {
      queryBuilder = queryBuilder.eq('status', status);
    }
    
    // Apply sorting
    queryBuilder = queryBuilder.order('created_at', { ascending: false });
    
    // Execute the query
    const { data, error } = await queryBuilder.get();
    
    if (error) throw error
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching requests:', error)
    return NextResponse.json(
      { error: 'Failed to fetch requests' },
      { status: 500 }
    )
  }
}
