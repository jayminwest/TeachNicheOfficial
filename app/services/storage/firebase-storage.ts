import { StorageService } from './interface';
import { storage } from '@/app/lib/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

export class FirebaseStorage implements StorageService {
  async uploadFile(path: string, file: File | Blob | Buffer): Promise<string> {
    try {
      // Create a reference to the file location in Firebase Storage
      const storageRef = ref(storage, path);
      
      // Convert Buffer to Blob if needed
      let fileData: File | Blob;
      if (file instanceof Buffer) {
        fileData = new Blob([file]);
      } else {
        fileData = file;
      }
      
      // Upload the file
      const snapshot = await uploadBytes(storageRef, fileData);
      
      // Get the download URL
      return getDownloadURL(snapshot.ref);
    } catch (error) {
      console.error('Error uploading file to Firebase Storage:', error);
      throw error;
    }
  }
  
  async getFileUrl(path: string): Promise<string> {
    try {
      const storageRef = ref(storage, path);
      return await getDownloadURL(storageRef);
    } catch (error) {
      console.error('Error getting file URL from Firebase Storage:', error);
      throw error;
    }
  }
  
  async deleteFile(path: string): Promise<void> {
    try {
      const storageRef = ref(storage, path);
      await deleteObject(storageRef);
    } catch (error) {
      console.error('Error deleting file from Firebase Storage:', error);
      throw error;
    }
  }
}
