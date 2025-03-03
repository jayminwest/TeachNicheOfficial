// This file provides type declarations for Next.js page components
import { ReactNode } from 'react';

declare module 'next' {
  export interface PageProps {
    params?: Record<string, string>;
    searchParams?: Record<string, string | string[]>;
  }
}

declare global {
  namespace JSX {
    interface Element extends ReactNode {}
  }
}
