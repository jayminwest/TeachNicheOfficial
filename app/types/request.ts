export interface RequestVoteResponse {
  success: boolean;
  currentVotes: number;
  userHasVoted: boolean;
  error?: 'unauthenticated' | 'database_error' | 'already_voted' | 'rate_limited' | 'invalid_input';
  data?: {
    id: string;
    request_id: string;
    user_id: string;
    vote_type: 'up' | 'down';
    created_at: string;
  } | null;
}
