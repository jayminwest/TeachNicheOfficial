/**
 * Global type definitions for the application
 */

// Fix for File instanceof checks
interface FileConstructor {
  new(fileBits: BlobPart[], fileName: string, options?: FilePropertyBag): File;
  prototype: File;
}

declare global {
  // Make File available globally for instanceof checks
  var File: FileConstructor;
  
  interface File extends Blob {
    readonly lastModified: number;
    readonly name: string;
    readonly webkitRelativePath: string;
    readonly type: string;
  }
  
  // Add type definitions for Supabase compatibility layer
  interface SupabaseClient {
    from: (table: string) => SupabaseQueryBuilder;
    storage: unknown;
  }
  
  interface SupabaseQueryBuilder {
    select: (columns?: string) => SupabaseQueryBuilder;
    eq: (column: string, value: any) => SupabaseQueryBuilder;
    order: (column: string, options?: { ascending?: boolean }) => SupabaseQueryBuilder;
    match: (query: Record<string, unknown>) => SupabaseQueryBuilder;
    single: () => Promise<{ data: any; error: any }>;
    limit: (count: number) => SupabaseQueryBuilder;
    data: any[];
    error: any;
  }
  
  // Firebase Auth type extensions
  interface FirebaseAuth {
    onAuthStateChanged: (callback: (user: unknown) => void) => () => void;
  }
}

// Extended alert variant types
declare module "@/app/components/ui/alert" {
  export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: "default" | "destructive" | "warning";
  }
}

// Firebase client mock for tests
declare module "@/app/lib/firebase" {
  export const db: unknown;
}

// Supabase compatibility layer
declare global {
  interface Window {
    supabase: unknown;
  }
  
  let supabase: {
    from: (table: string) => unknown;
    storage: unknown;
  };
  
  // Firebase Auth types
  let getAuth: () => unknown;
  let getApp: () => unknown;
  let getFirebaseAuth: () => unknown;
  
  // Jest extensions
  namespace jest {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface MockedFunction<T> {
      lastCallOptions?: unknown;
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
