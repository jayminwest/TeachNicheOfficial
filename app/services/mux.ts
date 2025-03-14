// Re-export from the comprehensive implementation
import { 
  createUpload,
  getUploadStatus,
  getAssetStatus,
  deleteAsset,
  MuxUploadResponse,
  MuxAssetStatusResponse,
  MuxUploadStatusResponse
} from './mux/index';

// For backward compatibility
export function getMuxClient() {
  console.warn('getMuxClient() is deprecated. Use the typed functions from @/app/services/mux/index.ts instead.');
  // Import dynamically to avoid bundling issues
  const Mux = require('@mux/mux-node').default;
  return new Mux({
    tokenId: process.env.MUX_TOKEN_ID!,
    tokenSecret: process.env.MUX_TOKEN_SECRET!
  });
}

// Re-export all the typed functions
export {
  createUpload,
  getUploadStatus,
  getAssetStatus,
  deleteAsset,
  MuxUploadResponse,
  MuxAssetStatusResponse,
  MuxUploadStatusResponse
};
