export interface Profile {
  id: string;
  full_name: string;
  email: string;
  bio?: string;
  avatar_url?: string;
  social_media_tag?: string;
  created_at: string;
  updated_at: string;
  stripe_account_id?: string;
  deleted_at?: string;
  stripe_account_status?: string;
  stripe_account_details?: Record<string, unknown>;
  stripe_onboarding_complete?: boolean;
}

export interface StripeAccountStatus {
  isComplete: boolean;
  status: string;
  details?: {
    pendingVerification: boolean;
    missingRequirements: string[];
    has_details_submitted?: boolean;
    has_charges_enabled?: boolean;
    has_payouts_enabled?: boolean;
    last_checked?: string;
  };
}
