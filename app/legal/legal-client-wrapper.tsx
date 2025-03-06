'use client';

import { useEffect, useState } from 'react';
import LegalContent from './legal-content';

export default function LegalClientWrapper() {
  // Use client-side only rendering
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  if (!isClient) {
    return <div className="container mx-auto px-4 py-8 mt-16">Loading legal information...</div>;
  }
  
  return <LegalContent />;
}
