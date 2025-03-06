import { Metadata } from 'next';

// Define proper types for Next.js page components
export interface PageProps {
  params: { [key: string]: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}

// Type for metadata generation functions
export interface MetadataProps {
  params: Record<string, string>;
  searchParams?: Record<string, string | string[] | undefined>;
}

// Helper type for generateMetadata functions
export type GenerateMetadata = (props: MetadataProps) => Promise<Metadata>;
