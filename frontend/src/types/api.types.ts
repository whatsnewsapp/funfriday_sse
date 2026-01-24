export interface User {
  user_id: string;
  user_name: string;
}

export interface Party {
  party_id: string;
  creator: string;
  creator_name?: string;
  category: string;
  rounds: number;
  timeout: number;
  participants: number | ParticipantInfo[];
  state: 'waiting_for_players' | 'in_progress' | 'ended_successfully';
}

export interface ParticipantInfo {
  user_id: string;
  user_name: string;
}

export interface Question {
  round: number;
  total_rounds: number;
  question: string;
  choices: string[];
  timeout: number;
}

export interface Score {
  user_id: string;
  user_name: string;
  score: number;
  category_scores: Record<string, number>;
  is_correct?: boolean;
}

export interface GameEvent {
  event: string;
  data?: any;
}
