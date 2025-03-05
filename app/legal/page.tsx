import { Suspense } from 'react';
import LegalClientWrapper from './legal-client-wrapper';

export default function LegalPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8 mt-16">Loading legal information...</div>}>
      <LegalClientWrapper />
    </Suspense>
  );
}
