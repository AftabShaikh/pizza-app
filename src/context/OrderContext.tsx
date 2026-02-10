'use client';

import React, { createContext, useContext, useState } from 'react';
import { Order, OrderContextType } from '@/types';
import { generateId } from '@/lib/utils';

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export function OrderProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);

  const createOrder = async (orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<Order> => {
    const newOrder: Order = {
      ...orderData,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      // Save order to API
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newOrder),
      });

      if (!response.ok) {
        throw new Error('Failed to create order');
      }

      const savedOrder = await response.json();
      
      setOrders(prev => [...prev, savedOrder]);
      setCurrentOrder(savedOrder);
      
      return savedOrder;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  };

  const getOrderById = (orderId: string): Order | null => {
    return orders.find(order => order.id === orderId) || null;
  };

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error('Failed to update order status');
      }

      const updatedOrder = await response.json();
      
      setOrders(prev => 
        prev.map(order => 
          order.id === orderId 
            ? { ...order, status, updatedAt: new Date().toISOString() }
            : order
        )
      );

      if (currentOrder && currentOrder.id === orderId) {
        setCurrentOrder(prev => prev ? { ...prev, status, updatedAt: new Date().toISOString() } : null);
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  };

  const getUserOrders = (customerId: string): Order[] => {
    return orders.filter(order => order.customerId === customerId);
  };

  const value: OrderContextType = {
    orders,
    currentOrder,
    createOrder,
    getOrderById,
    updateOrderStatus,
    getUserOrders,
  };

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
}

export function useOrder() {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error('useOrder must be used within an OrderProvider');
  }
  return context;
}