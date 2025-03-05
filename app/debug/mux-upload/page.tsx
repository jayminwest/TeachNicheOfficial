// Static page with no client components to avoid useSearchParams() error
export const dynamic = 'force-static';

export default function MuxUploadDebugPage() {
  return (
    <div className="container mx-auto px-4 py-8 mt-16">
      <h1 className="text-3xl font-bold mb-6">Mux Upload Debug</h1>
      
      <div className="bg-card rounded-lg border shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/2 mb-4"></div>
          <div className="h-32 bg-muted rounded w-full mb-4"></div>
          <div className="h-10 bg-muted rounded w-1/4 mb-4"></div>
        </div>
      </div>
      
      <noscript>
        <div className="p-4 bg-yellow-100 text-yellow-800 rounded-md mt-4">
          JavaScript is required to use the Mux upload debug tool. Please enable JavaScript or use a browser that supports it.
        </div>
      </noscript>
      
      <script dangerouslySetInnerHTML={{ 
        __html: `
          // Load the actual debug content after page loads
          document.addEventListener('DOMContentLoaded', function() {
            const script = document.createElement('script');
            script.src = '/mux-upload-debug.js';
            script.async = true;
            document.body.appendChild(script);
          });
        `
      }} />
    </div>
  );
}
