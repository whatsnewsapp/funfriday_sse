import { getDatabase } from '../config/database.js';
import { Question, QuestionForGame } from '../models/question.model.js';

export async function getRandomQuestions(
  category: string,
  count: number
): Promise<QuestionForGame[]> {
  const db = getDatabase();
  const questionsCollection = db.collection<Question>('questions');

  try {
    // Get random questions from the specified category
    const questions = await questionsCollection
      .aggregate<Question>([
        { $match: { category } },
        { $sample: { size: count } }
      ])
      .toArray();

    if (questions.length < count) {
      throw new Error(`Insufficient questions in category '${category}'. Found ${questions.length}, need ${count}`);
    }

    // Transform questions and randomize choices
    return questions.map((q) => {
      const choices = shuffleArray([q.answer, q.choice1, q.choice2, q.choice3]);
      return {
        id: q.id,
        question: q.question,
        choices,
        answer: q.answer,
      };
    });
  } catch (error) {
    console.error('Error fetching random questions:', error);
    throw error;
  }
}

export async function getCategories(): Promise<string[]> {
  const db = getDatabase();
  const questionsCollection = db.collection<Question>('questions');

  try {
    const categories = await questionsCollection
      .distinct('category');
    return categories.sort();
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
}

// Fisher-Yates shuffle algorithm
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
