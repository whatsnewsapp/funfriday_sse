export interface Question {
  id: number;
  question: string;
  answer: string;
  choice1: string;
  choice2: string;
  choice3: string;
  category: string;
}

export interface QuestionForGame {
  id: number;
  question: string;
  choices: string[];
  answer: string;
}
