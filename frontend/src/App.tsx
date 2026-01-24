import { Routes, Route } from 'react-router-dom';
import { useUser } from './hooks/useUser';
import ProtectedRoute from './components/common/ProtectedRoute';
import LobbyPage from './components/lobby/LobbyPage';
import GameCreationPage from './components/gamecreation/GameCreationPage';
import QuizPage from './components/quiz/QuizPage';

function App() {
  const { user } = useUser();

  return (
    <div className="app">
      <header className="header">
        <div className="container">
          <h1>Fun Friday Quiz</h1>
          {user && <p>Welcome, {user.userName}!</p>}
        </div>
      </header>
      <main className="container">
        <Routes>
          <Route path="/" element={<LobbyPage />} />
          <Route path="/create" element={
            <ProtectedRoute>
              <GameCreationPage />
            </ProtectedRoute>
          } />
          <Route path="/quiz/:partyId" element={
            <ProtectedRoute>
              <QuizPage />
            </ProtectedRoute>
          } />
        </Routes>
      </main>
    </div>
  );
}

export default App;
