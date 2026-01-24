import { memoryStore } from '../config/memory.js';
import { User } from '../models/user.model.js';
import { v4 as uuidv4 } from 'uuid';

export async function createUser(userName: string): Promise<string> {
  const userId = uuidv4();

  const user: User = {
    user_id: userId,
    user_name: userName,
    current_party: {
      party_id: '',
      score: 0,
      category_scores: {},
    },
  };

  await saveUserToMemory(userId, user);
  return userId;
}

export async function loadUserFromMemory(userId: string): Promise<User | null> {
  try {
    const data = await memoryStore.get(`user:${userId}`);
    if (!data) return null;
    return JSON.parse(data) as User;
  } catch (error) {
    console.error('Error loading user from memory:', error);
    return null;
  }
}

export async function saveUserToMemory(userId: string, user: User): Promise<void> {
  try {
    await memoryStore.set(`user:${userId}`, JSON.stringify(user));
  } catch (error) {
    console.error('Error saving user to memory:', error);
    throw error;
  }
}

export async function getAllUsers(): Promise<Record<string, User>> {
  const users: Record<string, User> = {};

  try {
    const keys = await memoryStore.keys('user:*');

    for (const key of keys) {
      const data = await memoryStore.get(key);
      if (data) {
        const user = JSON.parse(data) as User;
        users[user.user_id] = user;
      }
    }

    return users;
  } catch (error) {
    console.error('Error getting all users:', error);
    return users;
  }
}

export async function updateUserScore(
  userId: string,
  category: string,
  points: number
): Promise<void> {
  const user = await loadUserFromMemory(userId);
  if (!user) throw new Error('User not found');

  user.current_party.score += points;

  if (!user.current_party.category_scores[category]) {
    user.current_party.category_scores[category] = 0;
  }
  user.current_party.category_scores[category] += points;

  await saveUserToMemory(userId, user);
}

export async function setUserParty(userId: string, partyId: string): Promise<void> {
  const user = await loadUserFromMemory(userId);
  if (!user) throw new Error('User not found');

  user.current_party = {
    party_id: partyId,
    score: 0,
    category_scores: {},
  };

  await saveUserToMemory(userId, user);
}

// Export aliases for backward compatibility with routes
export const loadUserFromRedis = loadUserFromMemory;
export const saveUserToRedis = saveUserToMemory;
