import { NextRequest, NextResponse } from 'next/server';
import { lessonsService } from '@/app/services/database/lessonsService';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the lesson ID from the URL
    const lessonId = params.id;
    
    // Get the current user session
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Check if the user is the owner of the lesson
    const { data: isOwner, error: ownerCheckError } = await lessonsService.isLessonOwner(
      session.user.id,
      lessonId
    );
    
    if (ownerCheckError) {
      return NextResponse.json(
        { message: 'Failed to verify lesson ownership', details: ownerCheckError },
        { status: 500 }
      );
    }
    
    if (!isOwner) {
      return NextResponse.json(
        { message: 'You do not have permission to edit this lesson' },
        { status: 403 }
      );
    }
    
    // Parse the request body
    const data = await request.json();
    
    // Update the lesson
    const { data: updatedLesson, error } = await lessonsService.updateLesson(
      lessonId,
      {
        title: data.title,
        description: data.description,
        content: data.content,
        price: data.price,
        muxAssetId: data.muxAssetId,
        muxPlaybackId: data.muxPlaybackId,
      }
    );
    
    if (error) {
      return NextResponse.json(
        { message: 'Failed to update lesson', details: error },
        { status: 500 }
      );
    }
    
    return NextResponse.json(updatedLesson);
  } catch (error) {
    console.error('Error updating lesson:', error);
    return NextResponse.json(
      { message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const lessonId = params.id;
    
    const { data: lesson, error } = await lessonsService.getLessonById(lessonId);
    
    if (error) {
      return NextResponse.json(
        { message: 'Failed to fetch lesson', details: error },
        { status: 500 }
      );
    }
    
    if (!lesson) {
      return NextResponse.json(
        { message: 'Lesson not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(lesson);
  } catch (error) {
    console.error('Error fetching lesson:', error);
    return NextResponse.json(
      { message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const lessonId = params.id;
    
    // Get the current user session
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Check if the user is the owner of the lesson
    const { data: isOwner, error: ownerCheckError } = await lessonsService.isLessonOwner(
      session.user.id,
      lessonId
    );
    
    if (ownerCheckError) {
      return NextResponse.json(
        { message: 'Failed to verify lesson ownership', details: ownerCheckError },
        { status: 500 }
      );
    }
    
    if (!isOwner) {
      return NextResponse.json(
        { message: 'You do not have permission to delete this lesson' },
        { status: 403 }
      );
    }
    
    // Soft delete the lesson
    const { data, error } = await lessonsService.deleteLesson(lessonId);
    
    if (error) {
      return NextResponse.json(
        { message: 'Failed to delete lesson', details: error },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ message: 'Lesson deleted successfully' });
  } catch (error) {
    console.error('Error deleting lesson:', error);
    return NextResponse.json(
      { message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
