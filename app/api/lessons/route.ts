import { NextResponse } from 'next/server';
import { firebaseClient } from '@/app/services/firebase-compat';
import { getAuth, User } from 'firebase/auth';
import { getApp } from 'firebase/app';

interface LessonData {
  title: string;
  description: string;
  price?: number;
  muxAssetId?: string;
  muxPlaybackId?: string;
  content?: string;
  status?: 'draft' | 'published' | 'archived';
  category?: string;
}

// Helper functions (not exported)
async function createLessonHandler(request: Request) {
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
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const data = await request.json();
    const { 
      title, 
      description, 
      price, 
      muxAssetId,
      muxPlaybackId,
      content = '',
      status = 'published',
      category
    } = data as LessonData;

    // Validate required fields
    if (!title || !description) {
      return NextResponse.json(
        { error: 'Title and description are required' },
        { status: 400 }
      );
    }

    // Create lesson in Firebase
    const lessonData = {
      id: crypto.randomUUID(), // Add UUID here
      title,
      description,
      price: price || 0,
      content,
      status: status as 'draft' | 'published' | 'archived',
      creator_id: user.uid, // Changed from user_id to creator_id to match database schema
      category,
      mux_asset_id: muxAssetId,
      mux_playback_id: muxPlaybackId,
      created_at: new Date().toISOString()
    };

    // Use Firebase client
    const { data: lesson, error } = await firebaseClient
      .from('lessons')
      .insert(lessonData);

    if (error) {
      return NextResponse.json(
        { 
          error: 'Failed to create lesson',
          details: typeof error === 'object' && error !== null && 'message' in error 
            ? String(error.message) 
            : 'Unknown error'
        },
        { status: 500 }
      );
    }

    return NextResponse.json(lesson, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Failed to create lesson',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function getLessonsHandler(request: Request) {
  const { searchParams } = new URL(request.url);
  // const limit = parseInt(searchParams.get('limit') || '10');
  const category = searchParams.get('category');
  const sort = searchParams.get('sort') || 'newest';
  
  try {
    // Firebase is already initialized in @/app/lib/firebase;
    
    // Create a reference to the lessons collection
    const lessonsRef = firebaseClient.from('lessons');
    
    // Build query parameters
    const queryParams: Record<string, string | boolean | number> = {};
    
    if (category) {
      queryParams.category = category;
    }
    
    // Determine sort field and direction
    let sortField = 'created_at';
    let sortDirection = 'desc';
    
    if (sort === 'oldest') {
      sortDirection = 'asc';
    } else if (sort === 'price_low') {
      sortField = 'price';
      sortDirection = 'asc';
    } else if (sort === 'price_high') {
      sortField = 'price';
      sortDirection = 'desc';
    }
    
    // Define a type for the query builder
    type QueryBuilder = {
      eq: (field: string, value: string | boolean | number) => QueryBuilder;
      order: (field: string, options: { ascending: boolean }) => QueryBuilder;
      get: () => Promise<{ 
        data: Array<Record<string, unknown>>; 
        error: Error | null | unknown 
      }>;
    };
    
    // Create a query builder and apply filters and sorting
    const queryBuilder = lessonsRef.select() as QueryBuilder;
    
    // Apply filters
    Object.entries(queryParams).forEach(([key, value]) => {
      queryBuilder.eq(key, value);
    });
    
    // Apply sorting
    queryBuilder.order(sortField, { ascending: sortDirection === 'asc' });
    
    // Execute the query
    const { data: lessons, error } = await queryBuilder.get();
    
    if (error) {
      return NextResponse.json(
        { 
          error: 'Failed to fetch lessons',
          details: typeof error === 'object' && error !== null && 'message' in error 
            ? String(error.message) 
            : 'Unknown error'
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ lessons });
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function updateLessonHandler(request: Request) {
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
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const data = await request.json();
    const { id, ...updateData } = data;

    if (!id) {
      return NextResponse.json(
        { error: 'Lesson ID is required' },
        { status: 400 }
      );
    }

    // Check if user has permission to update this lesson
    // Use Firebase client
    const { data: lessons } = await firebaseClient
      .from('lessons')
      .select()
      .eq('id', id)
      .get();
    
    const lesson = lessons && lessons.length > 0 ? lessons[0] : null;
      
    if (!lesson) {
      return NextResponse.json(
        { error: 'Lesson not found' },
        { status: 404 }
      );
    }
    
    const hasAccess = lesson.creator_id === user.uid; // Changed from user_id to creator_id to match database schema
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'You do not have permission to update this lesson' },
        { status: 403 }
      );
    }
    
    const { data: updatedLesson } = await firebaseClient
      .from('lessons')
      .update(updateData)
      .eq('id', id)
      .get();

    return NextResponse.json(updatedLesson);
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function deleteLessonHandler(request: Request) {
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
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Lesson ID is required' },
        { status: 400 }
      );
    }

    // Use Firebase client
    const { data: lessons } = await firebaseClient
      .from('lessons')
      .select()
      .eq('id', id)
      .get();
    
    const lesson = lessons && lessons.length > 0 ? lessons[0] : null;

    if (!lesson) {
      return NextResponse.json(
        { error: 'Lesson not found' },
        { status: 404 }
      );
    }

    // Check if user has permission to delete this lesson
    const hasAccess = lesson.creator_id === user.uid; // Changed from user_id to creator_id to match database schema
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this lesson' },
        { status: 403 }
      );
    }

    await firebaseClient
      .from('lessons')
      .delete()
      .eq('id', id)

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// App Router handler for POST
export async function POST(request: Request) {
  return createLessonHandler(request);
}

// GET handler for App Router
export async function GET(request: Request) {
  return getLessonsHandler(request);
}

// PUT handler for App Router
export async function PUT(request: Request) {
  return updateLessonHandler(request);
}

// DELETE handler for App Router
export async function DELETE(request: Request) {
  return deleteLessonHandler(request);
}
