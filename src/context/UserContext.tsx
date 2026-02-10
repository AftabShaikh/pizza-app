'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Customer, UserContextType } from '@/types';
import { generateId } from '@/lib/utils';

const UserContext = createContext<UserContextType | undefined>(undefined);

const STORAGE_KEY = 'pizza-user';

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Customer | null>(null);

  // Load user from localStorage on mount
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem(STORAGE_KEY);
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        setUser(userData);
      }
    } catch (error) {
      console.error('Failed to load user from localStorage:', error);
    }
  }, []);

  // Save user to localStorage whenever it changes
  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (error) {
      console.error('Failed to save user to localStorage:', error);
    }
  }, [user]);

  const login = (customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'> | Customer) => {
    const customer: Customer = {
      id: 'id' in customerData ? customerData.id : generateId(),
      ...customerData,
      createdAt: 'createdAt' in customerData ? customerData.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    setUser(customer);
  };

  const logout = () => {
    setUser(null);
  };

  const updateUser = (updates: Partial<Customer>) => {
    if (!user) return;
    
    const updatedUser: Customer = {
      ...user,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    setUser(updatedUser);
  };

  const value: UserContextType = {
    user,
    login,
    logout,
    updateUser,
    isLoggedIn: user !== null,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}