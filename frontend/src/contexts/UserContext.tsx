import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  studentId?: string;
}

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [user, setUserState] = useState<User | null>(null);

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('mindcare_user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUserState(parsedUser);
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        localStorage.removeItem('mindcare_user');
      }
    }
  }, []);

  const setUser = (userData: User | null) => {
    setUserState(userData);
    if (userData) {
      localStorage.setItem('mindcare_user', JSON.stringify(userData));
    } else {
      localStorage.removeItem('mindcare_user');
    }
  };

  const logout = () => {
    setUserState(null);
    localStorage.removeItem('mindcare_user');
  };

  const isAuthenticated = !!user;

  return (
    <UserContext.Provider value={{ user, setUser, logout, isAuthenticated }}>
      {children}
    </UserContext.Provider>
  );
};
