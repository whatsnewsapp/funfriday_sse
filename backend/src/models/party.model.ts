import { QuestionForGame } from './question.model.js';

export type PartyState = 'waiting_for_players' | 'in_progress' | 'ended_successfully';

export interface Party {
  game_id: string;
  creator: string;
  category: string;
  rounds: number;
  timeout: number;
  current_round: number;
  state: PartyState;
  question_pool: QuestionForGame[];
  current_question?: QuestionForGame & { started_at: number };
  participants: string[];
}

export interface PartyInfo {
  party_id: string;
  creator: string;
  creator_name?: string;
  category: string;
  rounds: number;
  timeout: number;
  participants: number | string[];
  state: PartyState;
}
