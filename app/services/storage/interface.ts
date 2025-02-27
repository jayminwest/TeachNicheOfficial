export interface StorageService {
  uploadFile(path: string, file: File | Blob | Buffer): Promise<string>;
  getFileUrl(path: string): Promise<string>;
  deleteFile(path: string): Promise<void>;
  // Add other storage methods as needed
}
