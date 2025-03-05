import { Suspense } from 'react';
import LegalContent from './legal-content';

export default function LegalPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8 mt-16">Loading legal information...</div>}>
      <LegalContent />
    </Suspense>
  );
}
