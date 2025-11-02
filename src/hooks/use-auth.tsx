"use client";

import React, { createContext, useContext, useState, ReactNode, useMemo } from 'react';
import { User, users } from '@/lib/data';
import { UserRole } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  login: (email: string) => void;
  logout: () => void;
  switchRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = (email: string) => {
    const foundUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    setUser(foundUser || users.find(u => u.role === 'user')!); // Fallback to a generic user
  };

  const logout = () => {
    setUser(null);
  };
  
  // Dev helper to switch roles easily
  const switchRole = (role: UserRole) => {
      const newUser = users.find(u => u.role === role);
      if (newUser) {
          setUser(newUser);
      }
  };

  const value = useMemo(() => ({
    user,
    login,
    logout,
    switchRole,
  }), [user]);

  return (
    <AuthContext.Provider value={value}>
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
