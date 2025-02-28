/**
 * Global type definitions for the application
 */

// Fix for File instanceof checks
interface FileConstructor {
  new(fileBits: BlobPart[], fileName: string, options?: FilePropertyBag): File;
  prototype: File;
}

declare var File: FileConstructor;

// Make File available for instanceof checks
interface File extends Blob {
  readonly lastModified: number;
  readonly name: string;
  readonly webkitRelativePath: string;
}

// Extended alert variant types
declare module "@/app/components/ui/alert" {
  export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: "default" | "destructive" | "warning";
  }
}

// Firebase client mock for tests
declare module "@/app/lib/firebase" {
  export const db: any;
}

// Supabase compatibility layer
declare global {
  interface Window {
    supabase: any;
  }
  
  var supabase: {
    from: (table: string) => any;
    storage: any;
  };
  
  // Firebase Auth types
  var getAuth: () => any;
  var getApp: () => any;
  var getFirebaseAuth: () => any;
  
  // Jest extensions
  namespace jest {
    interface MockedFunction<T extends (...args: any[]) => any> {
      lastCallOptions?: any;
    }
  }
}

// Status types for earnings
type EarningStatus = "pending" | "paid" | "failed";
type PayoutStatus = "pending" | "paid" | "failed" | "canceled";

// Firebase types
interface EligibleCreator {
  creator_id: string;
  [key: string]: unknown;
}

// User type extensions
declare module "firebase/auth" {
  interface User {
    id?: string;
  }
}

export {};
