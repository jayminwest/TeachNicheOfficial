import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import ProfilePageWrapper from './profile-page-wrapper';
import { PaymentSettings } from '@/app/components/profile/payment-settings';

export const dynamic = 'force-dynamic';

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-lg">Loading profile...</p>
        </div>
      </div>
    }>
      <div className="container mx-auto py-8">
        <ProfilePageWrapper />
        
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Payment Settings</h2>
          <PaymentSettings />
        </div>
      </div>
    </Suspense>
  );
}
