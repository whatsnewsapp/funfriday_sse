interface AnswersListProps {
  choices: string[];
  selectedAnswer: string | null;
  onSelect: (answer: string) => void;
  disabled?: boolean;
}

export default function AnswersList({ choices, selectedAnswer, onSelect, disabled }: AnswersListProps) {
  return (
    <div className="choices">
      {choices.map((choice) => (
        <button
          key={choice}
          className={`choice-btn ${selectedAnswer === choice ? 'selected' : ''}`}
          onClick={() => !disabled && onSelect(choice)}
          disabled={disabled}
        >
          {choice}
        </button>
      ))}
    </div>
  );
}
