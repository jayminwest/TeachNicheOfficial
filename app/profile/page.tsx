import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import ProfilePageWrapper from './profile-page-wrapper';

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
      <ProfilePageWrapper />
    </Suspense>
  );
}
