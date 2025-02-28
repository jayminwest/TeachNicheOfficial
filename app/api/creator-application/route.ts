import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuth, User } from "firebase/auth";
import { getApp } from "firebase/app";
import { firebaseClient } from '@/app/services/firebase-compat';

// Define interface for application data
interface CreatorApplication {
  id: string;
  status: string;
  user_id: string;
  motivation?: string;
  sample_lesson_title?: string;
  sample_lesson_content?: string;
  teaching_approach?: string;
  instagram_handle?: string | null;
  created_at?: string;
  updated_at?: string;
  [key: string]: string | null | undefined; // More specific index signature
}

// Schema for validation
const applicationSchema = z.object({
  motivation: z.string().min(100),
  lessonTitle: z.string().min(5).max(100),
  lessonContent: z.string().min(300),
  teachingApproach: z.string().min(100),
  instagramHandle: z.string().optional()
    .refine(val => !val || val.startsWith('@'), {
      message: "Instagram handle should start with @",
    })
    .refine(val => !val || (val.length > 1 && val.length <= 31), {
      message: "Instagram handle should be between 1 and 30 characters (excluding @)",
    })
    .refine(val => !val || /^@[a-zA-Z0-9._]+$/.test(val), {
      message: "Instagram handle can only contain letters, numbers, periods, and underscores",
    }),
});

export async function POST(request: Request) {
  try {
    // Get the current user
    const user = await new Promise<User | null>(resolve => {
      const auth = getAuth(getApp());
      const unsubscribe = auth.onAuthStateChanged(user => {
        unsubscribe();
        resolve(user);
      });
    });
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in to submit an application." },
        { status: 401 }
      );
    }
    
    // Parse and validate request body
    const body = await request.json();
    
    try {
      applicationSchema.parse(body);
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        return NextResponse.json(
          { error: "Validation failed", details: validationError.errors },
          { status: 400 }
        );
      }
    }
    
    // Check if user already has a pending or approved application
    const { data: existingApplications, error: queryError } = await firebaseClient
      .from('creator_applications')
      .select()
      .eq('user_id', user.uid);
    
    if (queryError) {
      console.error('Error checking existing applications:', queryError);
      return NextResponse.json(
        { error: "Failed to check existing applications" },
        { status: 500 }
      );
    }
    
    if (existingApplications && existingApplications.length > 0) {
      // Cast the existingApplications to the proper type
      const typedApplications = existingApplications as CreatorApplication[];
      const application = typedApplications.find(app => 
        app.status === 'pending' || app.status === 'approved'
      );
      
      if (!application) {
        // No pending or approved applications found
      } else if (application.status === 'approved') {
        return NextResponse.json(
          { error: "You are already an approved creator" },
          { status: 400 }
        );
      } else if (application.status === 'pending') {
        return NextResponse.json(
          { error: "You already have a pending application" },
          { status: 400 }
        );
      }
    }
    
    // Insert the application into the database
    const { data: insertResult, error: insertError } = await firebaseClient
      .from('creator_applications')
      .insert({
        user_id: user.uid,
        motivation: body.motivation,
        sample_lesson_title: body.lessonTitle,
        sample_lesson_content: body.lessonContent,
        teaching_approach: body.teachingApproach,
        instagram_handle: body.instagramHandle || null,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    
    if (insertError) {
      console.error('Error inserting application:', insertError);
      return NextResponse.json(
        { error: "Failed to submit application" },
        { status: 500 }
      );
    }
    
    // Return success response
    return NextResponse.json(
      { 
        message: "Application submitted successfully", 
        applicationId: insertResult?.id 
      },
      { status: 201 }
    );
    
  } catch (error) {
    console.error('Unexpected error in creator application submission:', error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
