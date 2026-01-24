const API_BASE = '/api';

export async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

export const api = {
  // User endpoints
  createUser: (userName: string) =>
    apiRequest<{ user_id: string }>('/user/create', {
      method: 'POST',
      body: JSON.stringify({ user_name: userName }),
    }),

  validateUser: (userId: string) =>
    apiRequest<{ user_id: string; user_name: string }>(`/user/${userId}`),

  // Party endpoints
  createParty: (playerId: string, category: string, rounds: number, timeout: number) =>
    apiRequest<{ party_id: string }>('/party/init', {
      method: 'POST',
      body: JSON.stringify({ player_id: playerId, category, rounds, timeout }),
    }),

  getParties: () =>
    apiRequest<{ parties: any[] }>('/party'),

  getParty: (partyId: string) =>
    apiRequest<any>(`/party/${partyId}`),

  joinParty: (partyId: string, userId: string) =>
    apiRequest<{ message: string; game_id: string }>(`/party/${partyId}/join`, {
      method: 'POST',
      body: JSON.stringify({ user_id: userId }),
    }),

  getCategories: () =>
    apiRequest<{ categories: string[] }>('/party/categories/list'),

  // Game endpoints
  startGame: (partyId: string, userId: string) =>
    apiRequest<{ message: string }>(`/party/${partyId}/start`, {
      method: 'POST',
      body: JSON.stringify({ user_id: userId }),
    }),

  submitAnswer: (partyId: string, userId: string, answer: string) =>
    apiRequest<{ success: boolean; correct: boolean; message: string }>(`/party/${partyId}/answer`, {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, answer }),
    }),
};
