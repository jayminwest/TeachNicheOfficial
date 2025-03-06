// Static page with no client components to avoid useSearchParams() error
export const dynamic = 'force-static';

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 pt-16">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Your Profile</h1>
          <div className="h-10 w-24 bg-muted rounded animate-pulse"></div>
        </div>
        <div className="bg-card rounded-lg border shadow-sm p-6">
          <div className="border-b mb-4">
            <div className="flex space-x-2 mb-4">
              <div className="h-10 w-24 bg-muted rounded animate-pulse"></div>
              <div className="h-10 w-24 bg-muted rounded animate-pulse"></div>
              <div className="h-10 w-24 bg-muted rounded animate-pulse"></div>
            </div>
          </div>
          
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
            <div className="h-10 bg-muted rounded w-full mb-2"></div>
            <div className="h-10 bg-muted rounded w-full mb-2"></div>
            <div className="h-10 bg-muted rounded w-full mb-2"></div>
            <div className="h-10 bg-muted rounded w-1/4 mb-4"></div>
          </div>
        </div>
      </div>
      
      <noscript>
        <div className="container max-w-4xl mx-auto px-4 py-8">
          <div className="p-4 bg-yellow-100 text-yellow-800 rounded-md">
            JavaScript is required to view your profile. Please enable JavaScript or use a browser that supports it.
          </div>
        </div>
      </noscript>
      
      <script dangerouslySetInnerHTML={{ 
        __html: `
          // Check if user is authenticated
          (function() {
            // Try to get auth data from localStorage
            const authData = localStorage.getItem('supabase.auth.token');
            
            // If no auth data, redirect to sign in
            if (!authData) {
              window.location.href = '/auth/signin?redirect=/profile';
            } else {
              // Load the actual profile content after page loads
              document.addEventListener('DOMContentLoaded', function() {
                const script = document.createElement('script');
                script.src = '/profile-client.js';
                script.async = true;
                document.body.appendChild(script);
              });
            }
          })();
        `
      }} />
    </div>
  );
}
