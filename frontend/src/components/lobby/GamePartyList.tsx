import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { useUser } from '../../hooks/useUser';
import { Party } from '../../types/api.types';
import ErrorPanel from '../common/ErrorPanel';

export default function GamePartyList() {
  const [parties, setParties] = useState<Party[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    loadParties();
    const interval = setInterval(loadParties, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadParties = async () => {
    try {
      const response = await api.getParties();
      setParties(response.parties);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load parties');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinParty = async (partyId: string) => {
    if (!user) return;

    try {
      await api.joinParty(partyId, user.userId);
      navigate(`/quiz/${partyId}`);
    } catch (err: any) {
      setError(err.message || 'Failed to join party');
    }
  };

  const handleCreateParty = () => {
    navigate('/create');
  };

  if (loading) {
    return <div className="loading">Loading parties...</div>;
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2>Available Parties</h2>
        <button className="btn btn-primary" onClick={handleCreateParty}>
          Create Party
        </button>
      </div>

      <ErrorPanel error={error} onDismiss={() => setError(null)} />

      {parties.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#718096' }}>
          No parties available. Create one to get started!
        </p>
      ) : (
        <div className="party-list">
          {parties.map((party) => (
            <div key={party.party_id} className="party-item">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3>{party.category}</h3>
                  <p>Host: {party.creator_name || 'Unknown'}</p>
                  <p>Rounds: {party.rounds} | Timeout: {party.timeout}s</p>
                  <p>Participants: {party.participants} | Status: {party.state}</p>
                </div>
                <button
                  className="btn btn-secondary"
                  onClick={() => handleJoinParty(party.party_id)}
                  disabled={party.state !== 'waiting_for_players'}
                >
                  {party.state === 'waiting_for_players' ? 'Join' : 'In Progress'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
