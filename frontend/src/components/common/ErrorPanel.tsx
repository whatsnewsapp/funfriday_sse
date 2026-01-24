interface ErrorPanelProps {
  error: string | null;
  onDismiss?: () => void;
}

export default function ErrorPanel({ error, onDismiss }: ErrorPanelProps) {
  if (!error) return null;

  return (
    <div className="error">
      {error}
      {onDismiss && (
        <button onClick={onDismiss} style={{ marginLeft: '1rem' }}>
          Dismiss
        </button>
      )}
    </div>
  );
}
