// Static page with no client components to avoid useSearchParams() error
export const dynamic = 'force-static';

import { Hero } from "@/app/components/ui/animated-hero";
import { Features } from "@/app/components/ui/features";
import { EmailSignup } from "@/app/components/ui/email-signup";

export default function Home() {
  return (
    <div className="flex flex-col">
      <div className="flex flex-col items-center justify-center p-8 min-h-[600px]" data-testid="hero-section-container">
        <Hero />
      </div>
      <Features />
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 py-16">
        <EmailSignup />
      </div>
      
      <script dangerouslySetInnerHTML={{ 
        __html: `
          // Load the auth dialog functionality after page loads
          document.addEventListener('DOMContentLoaded', function() {
            const script = document.createElement('script');
            script.src = '/home-client.js';
            script.async = true;
            document.body.appendChild(script);
          });
        `
      }} />
    </div>
  );
}
