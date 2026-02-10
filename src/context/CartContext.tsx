'use client';

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { CartItem, Pizza, PizzaSize, Topping, CartContextType } from '@/types';
import { generateId, calculateItemPrice } from '@/lib/utils';

interface CartState {
  items: CartItem[];
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: { pizza: Pizza; size: PizzaSize; toppings: Topping[]; quantity: number } }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { itemId: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'LOAD_CART'; payload: CartItem[] };

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const { pizza, size, toppings, quantity } = action.payload;
      const totalPrice = calculateItemPrice(pizza.basePrice, size, toppings) * quantity;
      
      const newItem: CartItem = {
        id: generateId(),
        pizzaId: pizza.id,
        pizza,
        size,
        toppings,
        quantity,
        totalPrice,
      };

      return {
        ...state,
        items: [...state.items, newItem],
      };
    }

    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter(item => item.id !== action.payload),
      };

    case 'UPDATE_QUANTITY': {
      const { itemId, quantity } = action.payload;
      
      if (quantity <= 0) {
        return {
          ...state,
          items: state.items.filter(item => item.id !== itemId),
        };
      }

      return {
        ...state,
        items: state.items.map(item =>
          item.id === itemId
            ? {
                ...item,
                quantity,
                totalPrice: calculateItemPrice(item.pizza.basePrice, item.size, item.toppings) * quantity,
              }
            : item
        ),
      };
    }

    case 'CLEAR_CART':
      return {
        ...state,
        items: [],
      };

    case 'LOAD_CART':
      return {
        ...state,
        items: action.payload,
      };

    default:
      return state;
  }
};

const CartContext = createContext<CartContextType | undefined>(undefined);

const STORAGE_KEY = 'pizza-cart';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(STORAGE_KEY);
      if (savedCart) {
        const cartItems = JSON.parse(savedCart);
        dispatch({ type: 'LOAD_CART', payload: cartItems });
      }
    } catch (error) {
      console.error('Failed to load cart from localStorage:', error);
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
    } catch (error) {
      console.error('Failed to save cart to localStorage:', error);
    }
  }, [state.items]);

  const addItem = (pizza: Pizza, size: PizzaSize, toppings: Topping[], quantity: number = 1) => {
    dispatch({ type: 'ADD_ITEM', payload: { pizza, size, toppings, quantity } });
  };

  const removeItem = (itemId: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: itemId });
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { itemId, quantity } });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  const getTotalPrice = (): number => {
    return state.items.reduce((total, item) => total + item.totalPrice, 0);
  };

  const getTotalItems = (): number => {
    return state.items.reduce((total, item) => total + item.quantity, 0);
  };

  const value: CartContextType = {
    items: state.items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getTotalPrice,
    getTotalItems,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}