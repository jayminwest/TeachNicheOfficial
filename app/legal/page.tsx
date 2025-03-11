// Static page with no client components to avoid useSearchParams() error
export const dynamic = 'force-static';

export default function LegalPage() {
  return (
    <div className="container mx-auto px-4 py-8 mt-16">
      <h1 className="text-3xl font-bold mb-6">Teach Niche Legal Information</h1>
      
      <div className="animate-pulse">
        <div className="h-6 bg-muted rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-muted rounded w-full mb-2"></div>
        <div className="h-4 bg-muted rounded w-5/6 mb-2"></div>
        <div className="h-4 bg-muted rounded w-4/5 mb-6"></div>
        
        <div className="h-6 bg-muted rounded w-2/3 mb-4"></div>
        <div className="h-4 bg-muted rounded w-full mb-2"></div>
        <div className="h-4 bg-muted rounded w-5/6 mb-2"></div>
        <div className="h-4 bg-muted rounded w-4/5 mb-6"></div>
      </div>
      
      <noscript>
        <div className="p-4 bg-yellow-100 text-yellow-800 rounded-md">
          JavaScript is required to view the complete legal information. Please enable JavaScript or use a browser that supports it.
        </div>
      </noscript>
      
      <script dangerouslySetInnerHTML={{ 
        __html: `
          // Load the actual legal content after page loads
          document.addEventListener('DOMContentLoaded', function() {
            fetch('/api/legal-content')
              .then(response => response.text())
              .then(html => {
                document.querySelector('.container').innerHTML = html;
              })
              .catch(error => {
                console.error('Error loading legal content:', error);
              });
          });
        `
      }} />
    </div>
  );
}
