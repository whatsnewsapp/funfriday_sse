import { useState, useEffect } from 'react';
import { api } from '../../../api/client';
import { Question } from '../../../types/api.types';
import AnswersList from './AnswersList';

interface QuestionViewProps {
  partyId: string;
  userId: string;
  question: Question;
}

export default function QuestionView({ partyId, userId, question }: QuestionViewProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(question.timeout);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTimeLeft(question.timeout);
    setSelectedAnswer(null);
    setSubmitted(false);
    setError(null);
  }, [question]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [question]);

  const handleSubmit = async () => {
    if (!selectedAnswer || submitted) return;

    setSubmitted(true);
    setError(null);

    try {
      await api.submitAnswer(partyId, userId, selectedAnswer);
    } catch (err: any) {
      setError(err.message || 'Failed to submit answer');
      setSubmitted(false);
    }
  };

  return (
    <div className="quiz-container">
      <div className="question-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <p style={{ color: '#667eea', fontWeight: 'bold' }}>
            Question {question.round} of {question.total_rounds}
          </p>
          <div className="timer">{timeLeft}s</div>
        </div>

        <h2 style={{ marginBottom: '1.5rem' }}>{question.question}</h2>

        {error && (
          <div className="error" style={{ marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <AnswersList
          choices={question.choices}
          selectedAnswer={selectedAnswer}
          onSelect={setSelectedAnswer}
          disabled={submitted}
        />

        {submitted ? (
          <div style={{ textAlign: 'center', marginTop: '1.5rem', color: '#667eea' }}>
            <p style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Answer Submitted: {selectedAnswer}</p>
            <p>Waiting for other players...</p>
          </div>
        ) : (
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={!selectedAnswer}
            style={{ width: '100%', marginTop: '1.5rem' }}
          >
            Submit Answer
          </button>
        )}
      </div>
    </div>
  );
}
