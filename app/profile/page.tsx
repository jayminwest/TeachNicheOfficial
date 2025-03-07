import { SearchParamsWrapper } from '../components/ui/search-params-wrapper';
import ProfilePageClient from './profile-page-client';
import { Loader2 } from 'lucide-react';

export default function ProfilePage() {
  return (
    <SearchParamsWrapper fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-lg">Loading profile...</p>
        </div>
      </div>
    }>
      <ProfilePageClient />
    </SearchParamsWrapper>
  );
}
