import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '../../hooks/useUser';
import { useSSE } from '../../hooks/useSSE';
import { api } from '../../api/client';
import { ParticipantInfo, Question, Score } from '../../types/api.types';
import StartQuiz from './StartQuiz';
import QuestionView from './questions/QuestionView';
import FinalScores from './scores/FinalScores';
import ErrorPanel from '../common/ErrorPanel';

type GamePhase = 'loading' | 'waiting' | 'playing' | 'finished';

export default function QuizPage() {
  const { partyId } = useParams<{ partyId: string }>();
  const { user } = useUser();
  const navigate = useNavigate();

  const [phase, setPhase] = useState<GamePhase>('loading');
  const [error, setError] = useState<string | null>(null);
  const [creatorId, setCreatorId] = useState<string | null>(null);
  const [participants, setParticipants] = useState<ParticipantInfo[]>([]);
  const [category, setCategory] = useState('');
  const [rounds, setRounds] = useState(0);
  const [timeout, setTimeout] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [finalScores, setFinalScores] = useState<Score[]>([]);

  const { events, isConnected, error: sseError } = useSSE(partyId || null, user?.userId || null);

  useEffect(() => {
    if (!partyId) {
      navigate('/');
      return;
    }

    loadPartyDetails();
  }, [partyId, navigate]);

  useEffect(() => {
    if (!events.length) return;

    const latestEvent = events[events.length - 1];
    console.log('Processing event:', latestEvent);

    switch (latestEvent.event) {
      case 'connected':
        console.log('SSE connected successfully');
        break;

      case 'new_question':
        setCurrentQuestion(latestEvent.data);
        setPhase('playing');
        break;

      case 'question_timeout':
        console.log('Question timeout', latestEvent.data);
        // Show correct answer briefly, then wait for next question
        break;

      case 'game_over':
        setFinalScores(latestEvent.data.final_scores || []);
        setPhase('finished');
        break;

      case 'player_joined':
        setParticipants(prev => [
          ...prev,
          { user_id: latestEvent.data.user_id, user_name: latestEvent.data.user_name }
        ]);
        break;

      case 'player_left':
        setParticipants(prev =>
          prev.filter(p => p.user_id !== latestEvent.data.user_id)
        );
        break;
    }
  }, [events]);

  const loadPartyDetails = async () => {
    if (!partyId) return;

    try {
      const party = await api.getParty(partyId);
      setCreatorId(party.creator_id);
      setParticipants(party.participants || []);
      setCategory(party.category);
      setRounds(party.rounds);
      setTimeout(party.timeout);

      if (party.state === 'in_progress') {
        setPhase('playing');
      } else if (party.state === 'ended_successfully') {
        setPhase('finished');
      } else {
        setPhase('waiting');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load party details');
    }
  };

  if (!partyId) {
    return null;
  }

  const isCreator = user.userId === creatorId;

  return (
    <div>
      <div style={{ marginBottom: '1rem', textAlign: 'center' }}>
        <span style={{ color: isConnected ? '#48bb78' : '#f56565', fontWeight: 'bold' }}>
          {isConnected ? '● Connected' : '● Disconnected'}
        </span>
      </div>

      <ErrorPanel error={error || sseError} onDismiss={() => setError(null)} />

      {phase === 'loading' && (
        <div className="loading">Loading party...</div>
      )}

      {phase === 'waiting' && (
        <StartQuiz
          partyId={partyId}
          userId={user.userId}
          isCreator={isCreator}
          participants={participants}
          category={category}
          rounds={rounds}
          timeout={timeout}
        />
      )}

      {phase === 'playing' && currentQuestion && (
        <QuestionView
          partyId={partyId}
          userId={user.userId}
          question={currentQuestion}
        />
      )}

      {phase === 'finished' && (
        <FinalScores scores={finalScores} />
      )}
    </div>
  );
}
