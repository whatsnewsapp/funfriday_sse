import { Score } from '../../../types/api.types';

interface ScoreListProps {
  scores: Score[];
}

export default function ScoreList({ scores }: ScoreListProps) {
  return (
    <table className="scores-table">
      <thead>
        <tr>
          <th>Rank</th>
          <th>Player</th>
          <th>Score</th>
        </tr>
      </thead>
      <tbody>
        {scores.map((score, index) => (
          <tr key={score.user_id}>
            <td style={{ fontWeight: 'bold' }}>#{index + 1}</td>
            <td>{score.user_name}</td>
            <td style={{ fontWeight: 'bold', color: '#667eea' }}>{score.score}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
