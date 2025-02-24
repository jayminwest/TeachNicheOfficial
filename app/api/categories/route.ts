import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ 
      cookies: async () => {
        const cookieStore = cookies()
        const tokenCookie = cookieStore.get('sb-qvxtrhiyzawrtdlehtga-auth-token')
        return new Map([
          ['sb-qvxtrhiyzawrtdlehtga-auth-token', tokenCookie]
        ])
      }
    })
    
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .order('name')

    if (error) {
      console.error('Error fetching categories:', error)
      return NextResponse.json(
        { error: 'Failed to fetch categories' },
        { status: 500 }
      )
    }

    return NextResponse.json(categories)
  } catch (error) {
    console.error('Error in categories endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
