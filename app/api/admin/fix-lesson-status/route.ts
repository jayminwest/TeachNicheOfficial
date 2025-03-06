import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/app/lib/supabase/server';
import { getAssetStatus } from '@/app/services/mux';

export async function POST() {
  try {
    // This endpoint should only be accessible in development or by admins
    if (process.env.NODE_ENV !== 'development') {
      const supabase = await createServerSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session || session.user.email !== process.env.ADMIN_EMAIL) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }
    
    const supabase = await createServerSupabaseClient();
    
    // Get all lessons with temporary playback IDs or draft status with a real asset ID
    const { data: lessons, error } = await supabase
      .from('lessons')
      .select('*')
      .or('mux_playback_id.like.temp_playback_%,and(status.eq.draft,not.mux_asset_id.like.temp_%)')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching lessons:', error);
      return NextResponse.json(
        { error: 'Failed to fetch lessons' },
        { status: 500 }
      );
    }
    
    console.log(`Found ${lessons.length} lessons to fix`);
    
    const results = {
      total: lessons.length,
      updated: 0,
      failed: 0,
      skipped: 0,
      details: [] as Array<{
        lessonId: string;
        status: string;
        reason?: string;
        playbackId?: string;
      }>
    };
    
    // Process each lesson
    for (const lesson of lessons) {
      try {
        if (!('id' in lesson)) {
          results.skipped++;
          results.details.push({
            lessonId: 'unknown',
            status: 'skipped',
            reason: 'Invalid lesson record: missing id'
          });
          continue;
        }
        // Skip lessons without an asset ID
        if (!('mux_asset_id' in lesson) || !lesson.mux_asset_id) {
          results.skipped++;
          results.details.push({
            lessonId: typeof lesson.id === 'string' ? lesson.id : 'unknown',
            status: 'skipped',
            reason: 'No Mux asset ID'
          });
          continue;
        }
        
        // Skip lessons with temporary asset IDs
        if (typeof lesson.mux_asset_id === 'string' && lesson.mux_asset_id.startsWith('temp_')) {
          results.skipped++;
          results.details.push({
            lessonId: typeof lesson.id === 'string' ? lesson.id : 'unknown',
            status: 'skipped',
            reason: 'Temporary asset ID'
          });
          continue;
        }
        
        // Check the asset status
        const assetStatus = await getAssetStatus(String(lesson.mux_asset_id));
        
        if (assetStatus.status === 'ready' && assetStatus.playbackId) {
          // Update the lesson
          const { error: updateError } = await supabase
            .from('lessons')
            .update({
              status: 'published',
              mux_playback_id: assetStatus.playbackId,
              updated_at: new Date().toISOString()
            } as any)
            .eq('id', lesson.id as string);
          
          if (updateError) {
            throw new Error(`Failed to update lesson: ${updateError.message}`);
          }
          
          results.updated++;
          results.details.push({
            lessonId: lesson.id,
            status: 'updated',
            playbackId: assetStatus.playbackId
          });
        } else if (assetStatus.status === 'errored') {
          results.failed++;
          results.details.push({
            lessonId: lesson.id,
            status: 'failed',
            reason: `Asset error: ${assetStatus.error?.message}`
          });
        } else {
          // Still processing
          results.skipped++;
          results.details.push({
            lessonId: lesson.id,
            status: 'skipped',
            reason: `Asset still processing (status: ${assetStatus.status})`
          });
        }
      } catch (error) {
        console.error(`Error processing lesson ${lesson.id}:`, error);
        results.failed++;
        results.details.push({
          lessonId: lesson.id,
          status: 'error',
          reason: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    return NextResponse.json(results);
  } catch (error) {
    console.error('Error in fix-lesson-status API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
