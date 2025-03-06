import RequestsClient from './requests-client';

export default function RequestsPage() {
  return (
    <div className="min-h-screen pt-16">
      <RequestsClient />
      
      <noscript>
        <div className="p-8">
          <div className="p-4 bg-yellow-100 text-yellow-800 rounded-md">
            JavaScript is required to view and interact with lesson requests. Please enable JavaScript or use a browser that supports it.
          </div>
        </div>
      </noscript>
    </div>
  );
}
