import { useState, useEffect, useContext, createContext, ReactNode } from 'react';
import { api } from '../api/client';

const USER_STORAGE_KEY = 'funfriday_user';

interface StoredUser {
  userId: string;
  userName: string;
}

interface UserContextType {
  user: StoredUser | null;
  saveUser: (userId: string, userName: string) => void;
  clearUser: () => void;
}

const UserContext = createContext<UserContextType | null>(null);

function loadUserFromStorage(): StoredUser | null {
  try {
    const stored = localStorage.getItem(USER_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading user from storage:', error);
    localStorage.removeItem(USER_STORAGE_KEY);
  }
  return null;
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<StoredUser | null>(loadUserFromStorage);

  // Validate user exists on backend when app loads
  useEffect(() => {
    if (user) {
      api.validateUser(user.userId).catch(() => {
        // User doesn't exist on backend, clear local storage
        console.log('User session expired, clearing local storage');
        setUser(null);
        localStorage.removeItem(USER_STORAGE_KEY);
      });
    }
  }, []);

  const saveUser = (userId: string, userName: string) => {
    const userData = { userId, userName };
    setUser(userData);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
  };

  const clearUser = () => {
    setUser(null);
    localStorage.removeItem(USER_STORAGE_KEY);
  };

  return (
    <UserContext.Provider value={{ user, saveUser, clearUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
