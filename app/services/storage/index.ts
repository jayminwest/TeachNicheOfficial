import { FirebaseStorage } from './firebase-storage';
import { StorageService } from './interface';

// Create a singleton instance of the storage service
const storageService: StorageService = new FirebaseStorage();

export default storageService;
export * from './interface';
