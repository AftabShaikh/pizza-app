// Core type definitions for the pizza ordering application

export interface PizzaSize {
  id: string;
  name: string;
  diameter: number;
  priceMultiplier: number;
}

export interface Topping {
  id: string;
  name: string;
  price: number;
  category: 'meat' | 'vegetable' | 'cheese' | 'sauce';
  image?: string;
}

export interface Pizza {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  category: 'classic' | 'premium' | 'vegetarian' | 'vegan' | 'specialty';
  image: string;
  ingredients: string[];
  isAvailable: boolean;
  cookingTime: number; // in minutes
  calories: number;
  defaultToppings: string[]; // topping IDs
}

export interface CartItem {
  id: string;
  pizzaId: string;
  pizza: Pizza;
  size: PizzaSize;
  toppings: Topping[];
  quantity: number;
  customizations?: string;
  totalPrice: number;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    apartment?: string;
  };
  preferences?: {
    favoriteSize?: string;
    favoriteToppings?: string[];
    allergies?: string[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  customerId: string;
  customer: Customer;
  items: CartItem[];
  status: 'pending' | 'confirmed' | 'preparing' | 'baking' | 'ready' | 'delivered' | 'cancelled';
  orderType: 'delivery' | 'pickup';
  subtotal: number;
  tax: number;
  deliveryFee: number;
  tip: number;
  total: number;
  estimatedDeliveryTime: string;
  actualDeliveryTime?: string;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod: 'card' | 'cash' | 'digital_wallet';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CartContextType {
  items: CartItem[];
  addItem: (pizza: Pizza, size: PizzaSize, toppings: Topping[], quantity?: number) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
}

export interface UserContextType {
  user: Customer | null;
  login: (customer: Customer) => void;
  logout: () => void;
  updateUser: (updates: Partial<Customer>) => void;
  isLoggedIn: boolean;
}

export interface OrderContextType {
  orders: Order[];
  currentOrder: Order | null;
  createOrder: (orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Order>;
  getOrderById: (orderId: string) => Order | null;
  updateOrderStatus: (orderId: string, status: Order['status']) => void;
  getUserOrders: (customerId: string) => Order[];
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Form types
export interface CheckoutFormData {
  customerInfo: {
    name: string;
    email: string;
    phone: string;
  };
  deliveryInfo: {
    type: 'delivery' | 'pickup';
    address?: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      apartment?: string;
    };
  };
  paymentInfo: {
    method: 'card' | 'cash';
    cardNumber?: string;
    expiryDate?: string;
    cvv?: string;
    cardName?: string;
  };
  orderNotes?: string;
}

export interface PizzaCustomizationProps {
  pizza: Pizza;
  selectedSize: PizzaSize;
  selectedToppings: Topping[];
  onSizeChange: (size: PizzaSize) => void;
  onToppingsChange: (toppings: Topping[]) => void;
}