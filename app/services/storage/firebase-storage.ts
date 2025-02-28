import { StorageService } from './interface';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { getStorage } from 'firebase/storage';
import { getApp } from 'firebase/app';

export class FirebaseStorage implements StorageService {
  async uploadFile(path: string, file: File | Blob | Buffer): Promise<string> {
    try {
      // Get storage instance
      const storage = getStorage(getApp());
      
      // Create a reference to the file location in Firebase Storage
      const storage = getStorage();
      const storageRef = ref(storage, path);
      
      // Convert Buffer to Blob if needed
      let fileData: File | Blob;
      if (Buffer.isBuffer(file)) {
        fileData = new Blob([file]);
      } else if (file instanceof Blob || (typeof File !== 'undefined' && file instanceof File)) {
        fileData = file;
      } else {
        throw new Error('Unsupported file type');
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
      const storageRef = ref(getStorage(), path);
      return await getDownloadURL(storageRef);
    } catch (error) {
      console.error('Error getting file URL from Firebase Storage:', error);
      throw error;
    }
  }
  
  async deleteFile(path: string): Promise<void> {
    try {
      const storage = getStorage();
      const storageRef = ref(storage, path);
      await deleteObject(storageRef);
    } catch (error) {
      console.error('Error deleting file from Firebase Storage:', error);
      throw error;
    }
  }
}
