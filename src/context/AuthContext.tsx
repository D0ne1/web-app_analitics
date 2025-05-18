import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types';

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void; // ← добавь эту строку!
  isAuthenticated: boolean;
  isLoading: boolean;
  hasRole: (roles: Role[]) => boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string, role: Role) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const API_URL = "http://localhost:5000";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    try {
      if (storedUser && storedUser !== 'undefined') {
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      localStorage.removeItem('user');
      setUser(null);
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка входа');
      
      setUser(data.user);
      localStorage.setItem('user', JSON.stringify(data.user));
      if (data.token) localStorage.setItem('token', data.token);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, username: string, password: string, role: Role) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username, password, role }),
      });
      const text = await res.text();
      console.log('Ответ сервера:', text);
      const data = text ? JSON.parse(text) : {};
      if (!res.ok) throw new Error(data.error || 'Ошибка регистрации');
      setUser(data.user);
      localStorage.setItem('user', JSON.stringify(data.user));
      if (data.token) localStorage.setItem('token', data.token);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
  };

  const hasRole = (roles: Role[]) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser, // ← обязательно добавь!
        isAuthenticated: !!user,
        isLoading,
        hasRole,
        login,
        register,
        logout,
      }}
    >
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