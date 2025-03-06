export interface RequestVoteResponse {
  success: boolean;
  currentVotes: number;
  userHasVoted: boolean;
  error?: 'unauthenticated' | 'database_error' | 'already_voted' | 'rate_limited';
}
