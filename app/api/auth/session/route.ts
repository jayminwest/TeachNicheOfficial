import { NextRequest, NextResponse } from 'next/server'
import { createSessionCookie } from '@/app/lib/firebase-auth-helpers'

export async function POST(req: NextRequest) {
  try {
    const { idToken } = await req.json()
    
    if (!idToken) {
      return NextResponse.json(
        { error: 'Missing idToken' },
        { status: 400 }
      )
    }
    
    // Create a session cookie
    const result = await createSessionCookie(idToken)
    
    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 401 }
      )
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error creating session:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
