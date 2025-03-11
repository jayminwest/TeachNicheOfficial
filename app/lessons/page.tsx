import SearchParamsWrapper from './search-params-wrapper';

export const dynamic = 'force-dynamic';

export default function LessonsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 pt-16">
      <div className="container max-w-7xl px-4 py-10 sm:px-6 lg:px-8 mx-auto">
        <SearchParamsWrapper />
      </div>
      
      <noscript>
        <div className="container max-w-7xl px-4 py-10 sm:px-6 lg:px-8 mx-auto">
          <div className="p-4 bg-yellow-100 text-yellow-800 rounded-md">
            JavaScript is required to view lessons. Please enable JavaScript or use a browser that supports it.
          </div>
        </div>
      </noscript>
    </div>
  );
}
