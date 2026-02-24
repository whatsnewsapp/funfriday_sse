export interface Question {
  id: number;
  question: string;
  answer: string;
  choices: string[];
  category: string;
  bankId?: string;
}

export interface QuestionForGame {
  id: number;
  question: string;
  choices: string[];
  answer: string;
}
