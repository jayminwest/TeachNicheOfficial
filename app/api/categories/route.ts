import { NextResponse } from 'next/server'

// Mock categories for development until Firestore is properly set up
const mockCategories = [
  { id: '1', name: 'Kendama Basics', description: 'Fundamental techniques for beginners' },
  { id: '2', name: 'Intermediate Tricks', description: 'More advanced techniques' },
  { id: '3', name: 'Advanced Combos', description: 'Complex combinations for experts' },
  { id: '4', name: 'Competition Skills', description: 'Techniques for competitive play' }
];

export async function GET() {
  try {
    // Return mock categories for now
    // This will be replaced with actual Firestore queries once the Firebase
    // server-side issues are resolved
    return NextResponse.json(mockCategories);
  } catch (error) {
    console.error('Error in categories endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
