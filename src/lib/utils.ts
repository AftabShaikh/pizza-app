import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price);
}

export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export function calculateItemPrice(
  basePrice: number,
  size: { priceMultiplier: number },
  toppings: { price: number }[]
): number {
  const sizedPrice = basePrice * size.priceMultiplier;
  const toppingsPrice = toppings.reduce((total, topping) => total + topping.price, 0);
  return sizedPrice + toppingsPrice;
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function estimateDeliveryTime(cookingTime: number, orderType: 'delivery' | 'pickup'): Date {
  const now = new Date();
  const additionalTime = orderType === 'delivery' ? 20 : 5; // 20 min delivery, 5 min pickup wait
  const totalMinutes = cookingTime + additionalTime;
  
  return new Date(now.getTime() + totalMinutes * 60000);
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePhone(phone: string): boolean {
  const phoneRegex = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
  return phoneRegex.test(phone);
}

export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}