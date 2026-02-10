'use client';

import React from 'react';
import { useCart } from '@/context/CartContext';
import { useUser } from '@/context/UserContext';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { formatPrice } from '@/lib/utils';
import { MinusIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import Image from 'next/image';

export default function CartPage() {
  const { items, updateQuantity, removeItem, getTotalPrice, getTotalItems } = useCart();
  const { isLoggedIn } = useUser();

  const subtotal = getTotalPrice();
  const tax = subtotal * 0.08; // 8% tax
  const deliveryFee = subtotal > 25 ? 0 : 3.99;
  const total = subtotal + tax + deliveryFee;

  if (items.length === 0) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50 pt-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto bg-gray-200 rounded-full flex items-center justify-center mb-4">
                <span className="text-4xl">🛒</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
              <p className="text-gray-600 mb-6">Add some delicious pizzas to get started!</p>
              <Link href="/">
                <Button size="lg">Browse Menu</Button>
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 pt-4">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Your Cart</h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <Image
                        src={item.pizza.image}
                        alt={item.pizza.name}
                        width={80}
                        height={80}
                        className="rounded-md object-cover"
                        onError={(e) => {
                          e.currentTarget.src = '/images/pizza-placeholder.svg';
                        }}
                      />
                      
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">{item.pizza.name}</h3>
                        <p className="text-sm text-gray-600">
                          {item.size.name} ({item.size.diameter}")
                        </p>
                        {item.toppings.length > 0 && (
                          <p className="text-sm text-gray-600">
                            Extra: {item.toppings.map(t => t.name).join(', ')}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <MinusIcon className="h-4 w-4" />
                        </Button>
                        <span className="font-medium">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <PlusIcon className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-lg font-semibold text-gray-900">
                          {formatPrice(item.totalPrice)}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(item.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-4">
                <CardHeader>
                  <h2 className="text-xl font-semibold text-gray-900">Order Summary</h2>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Subtotal ({getTotalItems()} items)</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>Tax</span>
                    <span>{formatPrice(tax)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>Delivery Fee</span>
                    <span className={deliveryFee === 0 ? 'text-green-600' : ''}>
                      {deliveryFee === 0 ? 'FREE' : formatPrice(deliveryFee)}
                    </span>
                  </div>
                  
                  {subtotal < 25 && (
                    <p className="text-sm text-gray-600">
                      Add {formatPrice(25 - subtotal)} more for free delivery!
                    </p>
                  )}
                  
                  <div className="border-t pt-4">
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Total</span>
                      <span>{formatPrice(total)}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {isLoggedIn ? (
                      <Link href="/checkout">
                        <Button className="w-full" size="lg">
                          Proceed to Checkout
                        </Button>
                      </Link>
                    ) : (
                      <div className="space-y-2">
                        <Link href="/login?redirect=/checkout">
                          <Button className="w-full" size="lg">
                            Login to Checkout
                          </Button>
                        </Link>
                        <p className="text-xs text-gray-500 text-center">
                          Or continue as guest
                        </p>
                        <Link href="/checkout">
                          <Button variant="outline" className="w-full">
                            Guest Checkout
                          </Button>
                        </Link>
                      </div>
                    )}
                    
                    <Link href="/">
                      <Button variant="outline" className="w-full">
                        Continue Shopping
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}