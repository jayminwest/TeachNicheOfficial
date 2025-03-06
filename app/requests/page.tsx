export const dynamic = 'force-dynamic';
import SearchParamsWrapper from './search-params-wrapper';
// Static page component that doesn't use any client hooks
export default function RequestsPage() {
  return (
    <div className="min-h-screen pt-16">
      
      
      <SearchParamsWrapper />
    </div>
  );
}
