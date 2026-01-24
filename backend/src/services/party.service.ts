import { memoryStore } from '../config/memory.js';
import { Party, PartyInfo, PartyState } from '../models/party.model.js';
import { QuestionForGame } from '../models/question.model.js';
import { v4 as uuidv4 } from 'uuid';
import { getAllUsers } from './user.service.js';

export async function createParty(
  creatorId: string,
  category: string,
  rounds: number,
  timeout: number,
  questionPool: QuestionForGame[]
): Promise<string> {
  const partyId = uuidv4();
  const gameId = uuidv4();

  const party: Party = {
    game_id: gameId,
    creator: creatorId,
    category,
    rounds,
    timeout,
    current_round: 0,
    state: 'waiting_for_players',
    question_pool: questionPool,
    participants: [creatorId],
  };

  await savePartyToMemory(partyId, party);
  return partyId;
}

export async function loadPartyFromMemory(partyId: string): Promise<Party | null> {
  try {
    const data = await memoryStore.get(`party:${partyId}`);
    if (!data) return null;
    return JSON.parse(data) as Party;
  } catch (error) {
    console.error('Error loading party from memory:', error);
    return null;
  }
}

export async function savePartyToMemory(partyId: string, party: Party): Promise<void> {
  try {
    await memoryStore.set(`party:${partyId}`, JSON.stringify(party));
  } catch (error) {
    console.error('Error saving party to memory:', error);
    throw error;
  }
}

export async function deletePartyFromMemory(partyId: string): Promise<void> {
  try {
    await memoryStore.del(`party:${partyId}`);
  } catch (error) {
    console.error('Error deleting party from memory:', error);
    throw error;
  }
}

export async function getAllParties(): Promise<PartyInfo[]> {
  const parties: PartyInfo[] = [];

  try {
    const keys = await memoryStore.keys('party:*');
    const users = await getAllUsers();

    for (const key of keys) {
      const partyId = key.split(':')[1];
      const data = await memoryStore.get(key);

      if (data) {
        const party = JSON.parse(data) as Party;
        const creatorName = users[party.creator]?.user_name || 'Unknown';

        parties.push({
          party_id: partyId,
          creator: party.creator,
          creator_name: creatorName,
          category: party.category,
          rounds: party.rounds,
          timeout: party.timeout,
          participants: party.participants.length,
          state: party.state,
        });
      }
    }

    return parties;
  } catch (error) {
    console.error('Error getting all parties:', error);
    return parties;
  }
}

export async function updatePartyState(partyId: string, state: PartyState): Promise<void> {
  const party = await loadPartyFromMemory(partyId);
  if (!party) throw new Error('Party not found');

  party.state = state;
  await savePartyToMemory(partyId, party);
}

export async function addParticipant(partyId: string, userId: string): Promise<void> {
  const party = await loadPartyFromMemory(partyId);
  if (!party) throw new Error('Party not found');

  if (!party.participants.includes(userId)) {
    party.participants.push(userId);
    await savePartyToMemory(partyId, party);
  }
}

export async function removeParticipant(partyId: string, userId: string): Promise<void> {
  const party = await loadPartyFromMemory(partyId);
  if (!party) return;

  party.participants = party.participants.filter((id) => id !== userId);

  if (party.participants.length === 0) {
    await deletePartyFromMemory(partyId);
  } else {
    await savePartyToMemory(partyId, party);
  }
}

// Export aliases for backward compatibility with routes
export const loadPartyFromRedis = loadPartyFromMemory;
export const savePartyToRedis = savePartyToMemory;
export const deletePartyFromRedis = deletePartyFromMemory;
