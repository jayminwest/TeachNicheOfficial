/**
 * Types for request operations and responses
 */

export interface RequestVoteResponse {
  success: boolean;
  currentVotes: number;
  userHasVoted: boolean;
  error?: RequestVoteError;
}

export type RequestVoteError = 
  | 'unauthenticated' 
  | 'already_voted' 
  | 'database_error'
  | 'rate_limited';

export interface RequestCreateResponse {
  success: boolean;
  request?: {
    id: string;
    title: string;
    description: string;
    category: string;
    created_at: string;
    status: 'open' | 'in_progress' | 'completed';
    vote_count: number;
  };
  error?: RequestCreateError;
}

export type RequestCreateError =
  | 'unauthenticated'
  | 'validation_error'
  | 'database_error'
  | 'rate_limited';

export interface RequestUpdateResponse {
  success: boolean;
  request?: {
    id: string;
    title: string;
    description: string;
    category: string;
    status: 'open' | 'in_progress' | 'completed';
  };
  error?: RequestUpdateError;
}

export type RequestUpdateError =
  | 'unauthenticated'
  | 'unauthorized'
  | 'validation_error'
  | 'database_error'
  | 'not_found';

export interface RequestDeleteResponse {
  success: boolean;
  error?: RequestDeleteError;
}

export type RequestDeleteError =
  | 'unauthenticated'
  | 'unauthorized'
  | 'database_error'
  | 'not_found';
