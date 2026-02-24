import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { Bank } from '../../types/api.types';
import { useUser } from '../../hooks/useUser';
import ErrorPanel from '../common/ErrorPanel';

export default function GameCreationPage() {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [selectedBankId, setSelectedBankId] = useState('');
  const [rounds, setRounds] = useState(5);
  const [timeout, setTimeout] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    loadBanks();
  }, []);

  const loadBanks = async () => {
    try {
      const response = await api.getBanks();
      setBanks(response.banks);
      if (response.banks.length > 0) {
        setSelectedBankId(response.banks[0].bankId);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load quiz banks');
    }
  };

  const selectedBank = banks.find((b) => b.bankId === selectedBankId);
  const maxRounds = selectedBank ? selectedBank.questionCount : 20;

  const handleBankChange = (bankId: string) => {
    setSelectedBankId(bankId);
    const bank = banks.find((b) => b.bankId === bankId);
    if (bank && rounds > bank.questionCount) {
      setRounds(bank.questionCount);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedBankId) {
      setError('Please select a quiz bank');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.createParty(user!.userId, selectedBankId, rounds, timeout);
      navigate(`/quiz/${response.party_id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create party');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2>Create Quiz Party</h2>

      <ErrorPanel error={error} onDismiss={() => setError(null)} />

      <form onSubmit={handleSubmit}>
        <label>
          <strong>Quiz Bank:</strong>
        </label>
        <select value={selectedBankId} onChange={(e) => handleBankChange(e.target.value)} disabled={loading}>
          {banks.map((bank) => (
            <option key={bank.bankId} value={bank.bankId}>
              {bank.title} ({bank.questionCount} questions)
            </option>
          ))}
        </select>
        {selectedBank && (
          <p style={{ margin: '0.25rem 0 0.5rem', fontSize: '0.9rem', color: '#666' }}>
            {selectedBank.description}
          </p>
        )}

        <label>
          <strong>Number of Rounds:</strong>
        </label>
        <input
          type="number"
          min="1"
          max={maxRounds}
          value={rounds}
          onChange={(e) => setRounds(Math.min(parseInt(e.target.value) || 1, maxRounds))}
          disabled={loading}
        />

        <label>
          <strong>Question Timeout (seconds):</strong>
        </label>
        <input
          type="number"
          min="5"
          max="120"
          value={timeout}
          onChange={(e) => setTimeout(parseInt(e.target.value))}
          disabled={loading}
        />

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/')} disabled={loading}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Creating...' : 'Create Party'}
          </button>
        </div>
      </form>
    </div>
  );
}
