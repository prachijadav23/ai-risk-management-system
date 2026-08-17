import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, unwrap, TOKENS } from '@/lib/api';
import type { User, Role } from '@/types';

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role?: Role) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState>({} as AuthState);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const loadMe = useCallback(async () => {
    if (!TOKENS.access) {
      setLoading(false);
      return;
    }
    try {
      const me = await unwrap<User>(api.get('/auth/me'));
      setUser(me);
    } catch {
      TOKENS.clear();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMe();
  }, [loadMe]);

  const login = async (email: string, password: string) => {
    const data = await unwrap<{ user: User; accessToken: string; refreshToken: string }>(
      api.post('/auth/login', { email, password })
    );
    TOKENS.set(data.accessToken, data.refreshToken);
    setUser(data.user);
  };

  const register = async (name: string, email: string, password: string, role?: Role) => {
    const data = await unwrap<{ user: User; accessToken: string; refreshToken: string }>(
      api.post('/auth/register', { name, email, password, role })
    );
    TOKENS.set(data.accessToken, data.refreshToken);
    setUser(data.user);
  };

  const logout = () => {
    api.post('/auth/logout', { refreshToken: TOKENS.refresh }).catch(() => undefined);
    TOKENS.clear();
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
