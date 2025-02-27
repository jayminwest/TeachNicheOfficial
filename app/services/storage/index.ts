import { SupabaseStorage } from './supabase-storage';
import { CloudStorage } from './cloud-storage';

// Use environment variable to determine which implementation to use
const USE_GCP = process.env.NEXT_PUBLIC_USE_GCP === 'true';

export const storageService = USE_GCP 
  ? new CloudStorage()
  : new SupabaseStorage();
