import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { useUser } from '../../hooks/useUser';
import ErrorPanel from '../common/ErrorPanel';

export default function GameCreationPage() {
  const [categories, setCategories] = useState<string[]>([]);
  const [category, setCategory] = useState('');
  const [rounds, setRounds] = useState(5);
  const [timeout, setTimeout] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await api.getCategories();
      setCategories(response.categories);
      if (response.categories.length > 0) {
        setCategory(response.categories[0]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load categories');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!category) {
      setError('Please select a category');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.createParty(user!.userId, category, rounds, timeout);
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
          <strong>Category:</strong>
        </label>
        <select value={category} onChange={(e) => setCategory(e.target.value)} disabled={loading}>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        <label>
          <strong>Number of Rounds:</strong>
        </label>
        <input
          type="number"
          min="1"
          max="20"
          value={rounds}
          onChange={(e) => setRounds(parseInt(e.target.value))}
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
