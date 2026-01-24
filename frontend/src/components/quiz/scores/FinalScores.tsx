import { useNavigate } from 'react-router-dom';
import { Score } from '../../../types/api.types';
import ScoreList from './ScoreList';

interface FinalScoresProps {
  scores: Score[];
}

export default function FinalScores({ scores }: FinalScoresProps) {
  const navigate = useNavigate();

  const sortedScores = [...scores].sort((a, b) => b.score - a.score);

  return (
    <div className="quiz-container">
      <div className="card">
        <h2 style={{ textAlign: 'center', marginBottom: '2rem', color: '#667eea' }}>
          Game Over! Final Scores
        </h2>

        <ScoreList scores={sortedScores} />

        <button
          className="btn btn-primary"
          onClick={() => navigate('/')}
          style={{ width: '100%', marginTop: '2rem' }}
        >
          Return to Lobby
        </button>
      </div>
    </div>
  );
}
