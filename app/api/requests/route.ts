import { NextResponse } from 'next/server'
import { lessonRequestSchema } from '@/app/lib/schemas/lesson-request'
import { createServerSupabaseClient } from '@/app/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    
    // Validate request body
    const validatedData = lessonRequestSchema.parse(body)

    // The schema validation should ensure title and description are present
    // but we'll add a type assertion to satisfy TypeScript
    const requestData = {
      ...validatedData,
      user_id: session.user.id,
      status: 'open',
      vote_count: 0,
      created_at: new Date().toISOString()
    } as {
      title: string;
      description: string;
      user_id: string;
      status: string;
      vote_count: number;
      created_at: string;
      category?: string;
      tags?: string[];
      instagram_handle?: string;
    };

    const { data, error } = await supabase
      .from('lesson_requests')
      .insert(requestData)
      .select()
      .single()

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
    const supabase = await createServerSupabaseClient()
    const { searchParams } = new URL(request.url)
    
    const category = searchParams.get('category')
    const status = searchParams.get('status')
    
    let query = supabase
      .from('lesson_requests')
      .select('*')
    
    if (category) {
      query = query.eq('category', category)
    }
    if (status) {
      query = query.eq('status', status)
    }
    
    const { data, error } = await query.order('created_at', { ascending: false })
    
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
