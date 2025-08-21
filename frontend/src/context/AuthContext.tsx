import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { HttpService } from '../services/api';

// Define a simple User interface for the profile data
interface UserProfile {
  id: number;
  username: string;
  role: string;
  // Add other user properties as needed
}

interface AuthContextType {
  isAuthenticated: boolean;
  login: (token: string) => Promise<void>; // login now returns a Promise
  logout: () => void;
  loading: boolean;
  user: UserProfile | null; // Add user profile to context
  fetchUserProfile: () => Promise<void>; // Add function to fetch user profile
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const token = localStorage.getItem('jwtToken');
    return !!token;
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [user, setUser] = useState<UserProfile | null>(null); // State for user profile

  const fetchUserProfile = async () => {
    try {
      const response = await HttpService.get<UserProfile>('/user/profile');
      setUser(response);
    } catch (err) {
      console.error('Failed to fetch user profile:', err);
      setUser(null); // Clear user if fetch fails
      // Optionally, force logout if profile cannot be fetched (e.g., token invalid)
      // logout();
    }
  };

  useEffect(() => {
    const verifyTokenAndFetchProfile = async () => {
      const token = localStorage.getItem('jwtToken');
      if (token) {
        try {
          await fetchUserProfile();
          setIsAuthenticated(true); // Set to true only if profile fetch succeeds
        } catch (error) {
          console.error('Failed to verify token or fetch profile:', error);
          setIsAuthenticated(false); // Set to false if profile fetch fails
          localStorage.removeItem('jwtToken'); // Clear invalid token
        }
      }
      setLoading(false);
    };

    verifyTokenAndFetchProfile();
  }, []);

  const login = async (token: string) => {
    console.log('Login function called with token:', token);
    localStorage.setItem('jwtToken', token);
    console.log('Token saved to localStorage:', token);
    try {
      await fetchUserProfile();
      setIsAuthenticated(true); // Set to true only if profile fetch succeeds
    } catch (error) {
      console.error('Failed to fetch profile after login:', error);
      setIsAuthenticated(false); // Set to false if profile fetch fails
      localStorage.removeItem('jwtToken'); // Clear invalid token
    }
  };

  const logout = () => {
    localStorage.removeItem('jwtToken');
    setIsAuthenticated(false);
    setUser(null); // Clear user profile on logout
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, loading, user, fetchUserProfile }}>
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