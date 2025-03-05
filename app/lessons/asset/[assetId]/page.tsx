import { getAssetStatus } from '@/app/services/mux';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/app/lib/supabase/server';
import { Status } from './types';
import AssetStatusPoll from './AssetStatusPoll';

const checkAssetStatus = async (assetId: string): Promise<Status> => {
  try {
    const asset = await getAssetStatus(assetId);

    // If the asset is ready and has a playback ID, update the lesson and redirect
    if (asset.status === 'ready' && asset.playbackId) {
      // Find the lesson associated with this asset
      const supabase = await createServerSupabaseClient();
      const { data: lesson } = await supabase
        .from('lessons')
        .select('id')
        .eq('mux_asset_id', assetId)
        .single();
      
      if (lesson) {
        // Update the lesson with the playback ID
        await supabase
          .from('lessons')
          .update({ 
            mux_playback_id: asset.playbackId,
            updated_at: new Date().toISOString()
          })
          .eq('id', lesson.id);
        
        // Redirect to the lesson page
        redirect(`/lessons/${lesson.id}`);
      }
    }

    return {
      status: asset.status,
      playbackId: asset.playbackId
    };
  } catch (error) {
    console.error('Error checking asset status:', error);
    return {
      status: 'errored',
      errors: [{ message: error instanceof Error ? error.message : 'Unknown error' }]
    };
  }
};

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: { assetId: string } }) {
  const { assetId } = params;
  const initialStatus = await checkAssetStatus(assetId);
  
  return (
    <div className="container max-w-4xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Processing Video</h1>
      <p className="mb-6">Your video is being processed. This may take a few minutes depending on the size and complexity of your video.</p>
      
      <AssetStatusPoll
        initialStatus={initialStatus}
        checkAssetStatus={async () => {
          'use server';
          return await checkAssetStatus(assetId);
        }}
      />
    </div>
  );
}
