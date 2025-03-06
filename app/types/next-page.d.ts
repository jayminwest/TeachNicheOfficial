// This file provides type declarations for Next.js page components
import { ReactNode } from 'react';

// Define the structure for Next.js page params
declare namespace NextJS {
  interface PageParams {
    [key: string]: string;
  }
}

// Augment the global namespace to include our custom types
declare global {
  namespace JSX {
    interface Element extends ReactNode {}
  }
}
