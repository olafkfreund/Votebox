'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from './api-client';

interface Venue {
  id: string;
  name: string;
  slug: string;
  email: string;
  spotifyAccountId: string | null;
  settings: Record<string, unknown>;
}

interface AuthContextType {
  venue: Venue | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshVenue: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [venue, setVenue] = useState<Venue | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      const token = apiClient.getToken();
      if (token) {
        try {
          const venueData = await apiClient.getCurrentVenue();
          setVenue(venueData);
        } catch (error) {
          console.error('Failed to fetch venue:', error);
          apiClient.setToken(null);
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await apiClient.login(email, password);
      setVenue(response.venue);
      router.push('/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    await apiClient.logout();
    setVenue(null);
    router.push('/login');
  };

  const refreshVenue = async () => {
    try {
      const venueData = await apiClient.getCurrentVenue();
      setVenue(venueData);
    } catch (error) {
      console.error('Failed to refresh venue:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        venue,
        isLoading,
        isAuthenticated: !!venue,
        login,
        logout,
        refreshVenue,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
