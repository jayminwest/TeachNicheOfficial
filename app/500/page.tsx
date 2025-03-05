import { Suspense } from 'react';
import Custom500Content from './content';

export default function Custom500Page() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-100"></div>
      </div>
    }>
      <Custom500Content />
    </Suspense>
  );
}
