/**
 * Global type definitions for the application
 */

// Fix for File instanceof checks
interface FileConstructor {
  new(fileBits: BlobPart[], fileName: string, options?: FilePropertyBag): File;
  prototype: File;
}

declare var File: FileConstructor;

// Extended alert variant types
declare module "@/app/components/ui/alert" {
  export interface AlertProps {
    variant?: "default" | "destructive" | "warning";
  }
}
