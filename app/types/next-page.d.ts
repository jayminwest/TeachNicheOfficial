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
    interface Element extends ReactNode {
      // Adding a property to make this not empty
      _reactNode?: unknown;
    }
  }
}

// Define a type for Next.js App Router page components
export type AppRouterPageProps<T extends Record<string, string> = Record<string, string>> = {
  params: T;
  searchParams?: { [key: string]: string | string[] | undefined };
};
