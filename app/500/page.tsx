import { Suspense } from 'react';
import Custom500Content from './content';

export default function Custom500Page() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <Custom500Content />
    </Suspense>
  );
}
