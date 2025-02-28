import { NextResponse } from 'next/server';
import { firestore } from '@/app/lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

// Fallback mock categories in case Firestore is not available
const mockCategories = [
  { id: '1', name: 'Kendama Basics', description: 'Fundamental techniques for beginners' },
  { id: '2', name: 'Intermediate Tricks', description: 'More advanced techniques' },
  { id: '3', name: 'Advanced Combos', description: 'Complex combinations for experts' },
  { id: '4', name: 'Competition Skills', description: 'Techniques for competitive play' }
];

export async function GET() {
  try {
    // Try to fetch categories from Firestore
    try {
      // Create a query against the collection
      const categoriesRef = collection(firestore, 'categories');
      const categoriesQuery = query(categoriesRef, orderBy('name'));
      
      // Execute the query
      const querySnapshot = await getDocs(categoriesQuery);
      
      // If we have results, map the documents to an array of categories
      if (!querySnapshot.empty) {
        const categories = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        return NextResponse.json(categories);
      }
      
      // If no categories found in Firestore, fall back to mock data
      console.log('No categories found in Firestore, using mock data');
    } catch (firestoreError) {
      console.error('Error fetching from Firestore:', firestoreError);
      console.log('Falling back to mock categories');
    }
    
    // Return mock categories as fallback
    return NextResponse.json(mockCategories);
  } catch (error) {
    console.error('Error in categories endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
