import { useEffect, useState, useCallback } from 'react';
import { GameEvent } from '../types/api.types';

export function useSSE(partyId: string | null, userId: string | null) {
  const [events, setEvents] = useState<GameEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(() => {
    if (!partyId || !userId) return null;

    const eventSource = new EventSource(`/api/party/${partyId}/events?user_id=${userId}`);

    eventSource.onopen = () => {
      console.log('SSE connection established');
      setIsConnected(true);
      setError(null);
    };

    eventSource.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data) as GameEvent;
        console.log('SSE event received:', event);
        setEvents((prev) => [...prev, event]);
      } catch (err) {
        console.error('Error parsing SSE message:', err);
      }
    };

    eventSource.onerror = (err) => {
      console.error('SSE error:', err);
      setIsConnected(false);
      setError('Connection lost. Attempting to reconnect...');
      eventSource.close();
    };

    return eventSource;
  }, [partyId, userId]);

  useEffect(() => {
    const eventSource = connect();

    return () => {
      if (eventSource) {
        console.log('Closing SSE connection');
        eventSource.close();
        setIsConnected(false);
      }
    };
  }, [connect]);

  const clearEvents = () => setEvents([]);

  return { events, isConnected, error, clearEvents };
}
