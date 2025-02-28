import { Storage } from '@google-cloud/storage';
import { StorageService } from './interface';

export class CloudStorage implements StorageService {
  private storage: Storage;
  private bucket: string;
  
  constructor() {
    this.storage = new Storage({
      projectId: process.env.GCP_PROJECT_ID,
      keyFilename: process.env.GCP_KEY_FILE // Path to service account key file
    });
    
    this.bucket = process.env.GCP_STORAGE_BUCKET || '';
  }
  
  async uploadFile(path: string, file: File | Blob | Buffer): Promise<string> {
    const fileBuffer = file instanceof Buffer 
      ? file 
      : Buffer.from(await file.arrayBuffer());
    
    const fileOptions = {
      contentType: file instanceof File ? file.type : undefined
    };
    
    await this.storage
      .bucket(this.bucket)
      .file(path)
      .save(fileBuffer, fileOptions);
    
    // Make the file publicly accessible
    await this.storage
      .bucket(this.bucket)
      .file(path)
      .makePublic();
    
    return `https://storage.googleapis.com/${this.bucket}/${path}`;
  }
  
  async getFileUrl(path: string): Promise<string> {
    return `https://storage.googleapis.com/${this.bucket}/${path}`;
  }
  
  async deleteFile(path: string): Promise<boolean> {
    await this.storage
      .bucket(this.bucket)
      .file(path)
      .delete();
    
    return true;
  }
}
