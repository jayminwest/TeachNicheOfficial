import { 
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject,
  listAll,
  UploadMetadata
} from 'firebase/storage';
import { getApp } from 'firebase/app';
import { StorageService } from './interface';

export class FirebaseStorageService implements StorageService {
  private storage;

  constructor() {
    const app = getApp();
    this.storage = getStorage(app);
  }

  async uploadFile(path: string, file: File | Blob | Buffer): Promise<string> {
    try {
      let fileData: File | Blob;
      if (Buffer.isBuffer(file)) {
        fileData = new Blob([file]);
      } else if (file instanceof Blob || file instanceof File) {
        fileData = file;
      } else {
        throw new Error('Unsupported file type');
      }
      
      const storageRef = ref(this.storage, path);
      const metadata: UploadMetadata = {
        contentType: this.getContentType(path, fileData),
        customMetadata: {
          uploadedAt: new Date().toISOString()
        }
      };
      
      const snapshot = await uploadBytes(storageRef, fileData, metadata);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  async getFileUrl(path: string): Promise<string> {
    try {
      const storageRef = ref(this.storage, path);
      return await getDownloadURL(storageRef);
    } catch (error) {
      console.error('Error getting file URL:', error);
      throw error;
    }
  }

  async deleteFile(path: string): Promise<void> {
    try {
      const storageRef = ref(this.storage, path);
      await deleteObject(storageRef);
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }

  async listFiles(directory: string): Promise<string[]> {
    try {
      const storageRef = ref(this.storage, directory);
      const result = await listAll(storageRef);
      
      const fileUrls: string[] = [];
      for (const itemRef of result.items) {
        const url = await getDownloadURL(itemRef);
        fileUrls.push(url);
      }
      
      return fileUrls;
    } catch (error) {
      console.error('Error listing files:', error);
      throw error;
    }
  }

  private getContentType(path: string, file: File | Blob): string {
    if (file instanceof File && file.type) {
      return file.type;
    }
    
    const extension = path.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'gif':
        return 'image/gif';
      case 'svg':
        return 'image/svg+xml';
      case 'pdf':
        return 'application/pdf';
      case 'doc':
        return 'application/msword';
      case 'docx':
        return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      case 'xls':
        return 'application/vnd.ms-excel';
      case 'xlsx':
        return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      case 'mp4':
        return 'video/mp4';
      case 'mp3':
        return 'audio/mpeg';
      default:
        return 'application/octet-stream';
    }
  }
}
