import { supabase } from '@/app/lib/supabase';
import { StorageService } from './interface';

export class SupabaseStorage implements StorageService {
  private bucket = 'media';
  
  async uploadFile(path: string, file: File | Blob | Buffer): Promise<string> {
    let fileData: File | Blob;
    
    if (file instanceof Buffer) {
      // Convert Buffer to Blob for Supabase
      fileData = new Blob([file]);
    } else {
      fileData = file;
    }
    
    const { data, error } = await supabase.storage
      .from(this.bucket)
      .upload(path, fileData, {
        upsert: true
      });
      
    if (error) throw error;
    
    const { data: urlData } = supabase.storage
      .from(this.bucket)
      .getPublicUrl(path);
      
    return urlData.publicUrl;
  }
  
  async getFileUrl(path: string): Promise<string> {
    const { data } = supabase.storage
      .from(this.bucket)
      .getPublicUrl(path);
      
    return data.publicUrl;
  }
  
  async deleteFile(path: string): Promise<void> {
    const { error } = await supabase.storage
      .from(this.bucket)
      .remove([path]);
      
    if (error) throw error;
  }
}
