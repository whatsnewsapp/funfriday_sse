import { useState } from 'react';
import { api } from '../../api/client';
import { useUser } from '../../hooks/useUser';
import ErrorPanel from '../common/ErrorPanel';

export default function UserLogin() {
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { saveUser } = useUser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userName.trim()) {
      setError('Please enter a username');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.createUser(userName.trim());
      saveUser(response.user_id, userName.trim());
    } catch (err: any) {
      setError(err.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2>Welcome to Fun Friday!</h2>
      <p style={{ marginBottom: '1.5rem' }}>Enter your name to get started</p>

      <ErrorPanel error={error} onDismiss={() => setError(null)} />

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Your Name"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          disabled={loading}
          autoFocus
        />
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Creating...' : 'Start Playing'}
        </button>
      </form>
    </div>
  );
}
