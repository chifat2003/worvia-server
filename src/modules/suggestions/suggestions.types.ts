export interface SuggestionUser {
  id: number;
  email: string;
  profile: {
    firstName: string;
    lastName: string;
    headline?: string;
    summary?: string;
    location?: string;
    skills?: string[];
  };
  matchScore: number;
  matchReason: string;
  mutualConnections: number;
  sharedSkills: string[];
}

export interface SuggestionsResponse {
  success: boolean;
  data?: SuggestionUser[];
  error?: string;
  meta?: {
    total: number;
    algorithm: string;
  };
}
