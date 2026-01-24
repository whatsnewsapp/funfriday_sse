export interface User {
  user_id: string;
  user_name: string;
  current_party: {
    party_id: string;
    score: number;
    category_scores: Record<string, number>;
  };
}

export interface UserScore {
  user_id: string;
  user_name: string;
  score: number;
  category_scores: Record<string, number>;
  is_correct?: boolean;
}
