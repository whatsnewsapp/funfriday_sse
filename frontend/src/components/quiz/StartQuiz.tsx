import { useState } from 'react';
import { api } from '../../api/client';
import { ParticipantInfo } from '../../types/api.types';
import ErrorPanel from '../common/ErrorPanel';

interface StartQuizProps {
  partyId: string;
  userId: string;
  isCreator: boolean;
  participants: ParticipantInfo[];
  category: string;
  rounds: number;
  timeout: number;
}

export default function StartQuiz({
  partyId,
  userId,
  isCreator,
  participants,
  category,
  rounds,
  timeout,
}: StartQuizProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStartGame = async () => {
    setLoading(true);
    setError(null);

    try {
      await api.startGame(partyId, userId);
    } catch (err: any) {
      setError(err.message || 'Failed to start game');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2>Waiting Room</h2>

      <ErrorPanel error={error} onDismiss={() => setError(null)} />

      <div style={{ marginBottom: '2rem' }}>
        <p><strong>Category:</strong> {category}</p>
        <p><strong>Rounds:</strong> {rounds}</p>
        <p><strong>Timeout:</strong> {timeout} seconds</p>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h3>Participants ({participants.length}):</h3>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {participants.map((p) => (
            <li key={p.user_id} style={{ padding: '0.5rem', background: '#f7fafc', marginBottom: '0.5rem', borderRadius: '4px' }}>
              {p.user_name}
            </li>
          ))}
        </ul>
      </div>

      {isCreator ? (
        <button className="btn btn-primary" onClick={handleStartGame} disabled={loading}>
          {loading ? 'Starting...' : 'Start Quiz'}
        </button>
      ) : (
        <p style={{ textAlign: 'center', color: '#718096' }}>
          Waiting for host to start the quiz...
        </p>
      )}
    </div>
  );
}
