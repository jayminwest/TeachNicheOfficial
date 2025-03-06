// This file provides type declarations for Next.js page components
import { ReactNode } from 'react';

// Define the structure for Next.js page params and props
declare namespace NextJS {
  interface PageParams {
    [key: string]: string;
  }
  
  interface PageProps {
    params: PageParams;
    searchParams?: { [key: string]: string | string[] | undefined };
  }
}

// Augment the global namespace to include our custom types
declare global {
  namespace JSX {
    interface Element extends ReactNode {}
  }
}
