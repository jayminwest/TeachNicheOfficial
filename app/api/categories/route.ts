import { NextResponse } from 'next/server'
import { firestore } from '@/app/lib/firebase'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'

export async function GET() {
  try {
    // Auth is initialized but not used - this is intentional for future use
    
    // Create a query against the collection
    const categoriesRef = collection(firestore, 'categories');
    const categoriesQuery = query(categoriesRef, orderBy('name'));
    
    // Execute the query
    const querySnapshot = await getDocs(categoriesQuery);
    
    // Map the documents to an array of categories
    const categories = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error in categories endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
