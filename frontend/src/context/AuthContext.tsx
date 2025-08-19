import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import api from '../services/api'; // Assuming api service is in ../services/api

interface AuthContextType {
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const token = localStorage.getItem('jwtToken');
    return !!token;
  });
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem('jwtToken');
      if (token) {
        setIsAuthenticated(true);
      }
      setLoading(false);
    };

    verifyToken();
  }, []);

  const login = (token: string) => {
    localStorage.setItem('jwtToken', token);
    console.log('Token saved to localStorage:', token);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('jwtToken');
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
