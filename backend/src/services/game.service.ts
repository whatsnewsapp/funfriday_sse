import { loadPartyFromCache, savePartyToCache, updatePartyState } from './party.service.js';
import { loadUserFromCache, getAllUsers, updateUserScore } from './user.service.js';
import { UserScore } from '../models/user.model.js';
import { broadcastToParty } from '../sse/event-broadcaster.js';

const activeTimeouts = new Map<string, NodeJS.Timeout>();

export async function startGame(partyId: string): Promise<void> {
  await updatePartyState(partyId, 'in_progress');
  await startRound(partyId);
}

export async function startRound(partyId: string): Promise<void> {
  const party = await loadPartyFromCache(partyId);
  if (!party) throw new Error('Party not found');

  // Check if game is over
  if (party.question_pool.length === 0) {
    const scores = await getFinalScores(partyId);
    await broadcastToParty(partyId, {
      event: 'game_over',
      data: { final_scores: scores },
    });
    await updatePartyState(partyId, 'ended_successfully');
    return;
  }

  // Clear answered users for the new round
  party.answered_users = [];

  // Pop next question
  const question = party.question_pool.shift()!;
  party.current_question = {
    ...question,
    started_at: Date.now(),
  };
  party.current_round += 1;
  await savePartyToCache(partyId, party);

  // Broadcast new question (without correct answer)
  await broadcastToParty(partyId, {
    event: 'new_question',
    data: {
      round: party.current_round,
      total_rounds: party.rounds,
      question: question.question,
      choices: question.choices,
      timeout: party.timeout,
    },
  });

  // Schedule timeout
  const timeoutId = setTimeout(async () => {
    activeTimeouts.delete(partyId);
    await handleQuestionTimeout(partyId, question.answer);
  }, party.timeout * 1000);

  activeTimeouts.set(partyId, timeoutId);
}

async function handleQuestionTimeout(partyId: string, correctAnswer: string): Promise<void> {
  const party = await loadPartyFromCache(partyId);
  if (!party) return;
  if (!party.current_question) return;

  const scores = await getPlayerScores(partyId);

  await broadcastToParty(partyId, {
    event: 'question_timeout',
    data: {
      correct_answer: correctAnswer,
      scores: scores,
    },
  });

  // Clear current question
  delete party.current_question;
  await savePartyToCache(partyId, party);

  // Start next round after delay
  setTimeout(async () => {
    const currentParty = await loadPartyFromCache(partyId);
    if (currentParty && currentParty.state === 'in_progress') {
      await startRound(partyId);
    }
  }, 3000);
}

export async function submitAnswer(
  partyId: string,
  userId: string,
  answer: string
): Promise<{ correct: boolean }> {
  const party = await loadPartyFromCache(partyId);
  if (!party) throw new Error('Party not found');
  if (!party.current_question) throw new Error('No active question');

  const isCorrect = answer === party.current_question.answer;

  if (isCorrect) {
    await updateUserScore(userId, party.category, 1);
  }

  // Track that this user has answered
  if (!party.answered_users) party.answered_users = [];
  party.answered_users.push(userId);
  await savePartyToCache(partyId, party);

  // If all participants have answered, end the round early
  if (party.answered_users.length === party.participants.length) {
    const timeoutId = activeTimeouts.get(partyId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      activeTimeouts.delete(partyId);
    }
    await handleQuestionTimeout(partyId, party.current_question!.answer);
  }

  return { correct: isCorrect };
}

export async function getPlayerScores(partyId: string): Promise<UserScore[]> {
  const party = await loadPartyFromCache(partyId);
  if (!party) return [];

  const scores: UserScore[] = [];

  for (const userId of party.participants) {
    const user = await loadUserFromCache(userId);
    if (user) {
      scores.push({
        user_id: user.user_id,
        user_name: user.user_name,
        score: user.current_party.score,
        category_scores: user.current_party.category_scores,
      });
    }
  }

  return scores.sort((a, b) => b.score - a.score);
}

export async function getFinalScores(partyId: string): Promise<UserScore[]> {
  return await getPlayerScores(partyId);
}
