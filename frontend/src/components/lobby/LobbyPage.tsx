import { useUser } from '../../hooks/useUser';
import UserLogin from './UserLogin';
import GamePartyList from './GamePartyList';

export default function LobbyPage() {
  const { user } = useUser();

  return (
    <div className="lobby-page">
      {!user ? <UserLogin /> : <GamePartyList />}
    </div>
  );
}
