/**
 * Type definitions for File and Blob interfaces
 * This helps resolve TypeScript errors with File instanceof checks
 */

interface FileConstructor {
  new(fileBits: BlobPart[], fileName: string, options?: FilePropertyBag): File;
  prototype: File;
}

interface File extends Blob {
  readonly lastModified: number;
  readonly name: string;
  readonly webkitRelativePath: string;
}

declare const File: FileConstructor;
