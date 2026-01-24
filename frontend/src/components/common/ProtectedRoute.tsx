import { Navigate } from 'react-router-dom';
import { useUser } from '../../hooks/useUser';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user } = useUser();

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
