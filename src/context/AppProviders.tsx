'use client';

import React from 'react';
import { CartProvider } from './CartContext';
import { UserProvider } from './UserContext';
import { OrderProvider } from './OrderContext';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      <CartProvider>
        <OrderProvider>
          {children}
        </OrderProvider>
      </CartProvider>
    </UserProvider>
  );
}