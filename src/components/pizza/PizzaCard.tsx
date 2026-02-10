'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { PlusIcon, MinusIcon, StarIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { Pizza, PizzaSize, Topping } from '@/types';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatPrice, calculateItemPrice } from '@/lib/utils';

interface PizzaCardProps {
  pizza: Pizza;
  sizes: PizzaSize[];
  toppings: Topping[];
}

export function PizzaCard({ pizza, sizes, toppings }: PizzaCardProps) {
  const [selectedSize, setSelectedSize] = useState(sizes.find(s => s.id === 'medium') || sizes[0]);
  const [selectedToppings, setSelectedToppings] = useState<Topping[]>(() => 
    pizza.defaultToppings.map(toppingId => 
      toppings.find(t => t.id === toppingId)
    ).filter(Boolean) as Topping[]
  );
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [quantity, setQuantity] = useState(1);
  
  const { addItem } = useCart();

  const totalPrice = calculateItemPrice(pizza.basePrice, selectedSize, selectedToppings);
  const rating = 4.5; // Mock rating

  const handleToppingToggle = (topping: Topping) => {
    setSelectedToppings(prev => {
      const exists = prev.find(t => t.id === topping.id);
      if (exists) {
        return prev.filter(t => t.id !== topping.id);
      } else {
        return [...prev, topping];
      }
    });
  };

  const handleAddToCart = () => {
    addItem(pizza, selectedSize, selectedToppings, quantity);
    setIsCustomizing(false);
    setQuantity(1);
  };

  const getCategoryColor = (category: Pizza['category']) => {
    switch (category) {
      case 'classic': return 'bg-blue-100 text-blue-800';
      case 'premium': return 'bg-purple-100 text-purple-800';
      case 'vegetarian': return 'bg-green-100 text-green-800';
      case 'vegan': return 'bg-emerald-100 text-emerald-800';
      case 'specialty': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="h-full flex flex-col transition-transform hover:scale-105">
      <CardHeader className="p-0">
        <div className="relative">
          <Image
            src={pizza.image}
            alt={pizza.name}
            width={400}
            height={300}
            className="w-full h-48 object-cover rounded-t-lg"
            onError={(e) => {
              e.currentTarget.src = '/images/pizza-placeholder.svg';
            }}
          />
          <div className="absolute top-2 left-2 flex gap-2">
            <Badge className={getCategoryColor(pizza.category)}>
              {pizza.category}
            </Badge>
            {!pizza.isAvailable && (
              <Badge variant="danger">
                Unavailable
              </Badge>
            )}
          </div>
          <div className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-sm">
            <div className="flex items-center space-x-1">
              <StarIconSolid className="h-4 w-4 text-yellow-400" />
              <span className="text-sm font-medium">{rating}</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1">
        <div className="space-y-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{pizza.name}</h3>
            <p className="text-sm text-gray-600 mt-1">{pizza.description}</p>
          </div>

          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>🕐 {pizza.cookingTime} min</span>
            <span>🔥 {pizza.calories} cal</span>
          </div>

          <div className="text-sm text-gray-600">
            <span className="font-medium">Ingredients: </span>
            {pizza.ingredients.join(', ')}
          </div>

          {isCustomizing && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              {/* Size Selection */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Size</h4>
                <div className="grid grid-cols-2 gap-2">
                  {sizes.map(size => (
                    <button
                      key={size.id}
                      onClick={() => setSelectedSize(size)}
                      className={`p-2 rounded-md border text-sm font-medium transition-colors ${
                        selectedSize.id === size.id
                          ? 'border-orange-500 bg-orange-50 text-orange-700'
                          : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div>{size.name}</div>
                      <div className="text-xs text-gray-500">{size.diameter}"</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Toppings */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Extra Toppings</h4>
                <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
                  {toppings.map(topping => {
                    const isSelected = selectedToppings.find(t => t.id === topping.id);
                    return (
                      <button
                        key={topping.id}
                        onClick={() => handleToppingToggle(topping)}
                        className={`flex items-center justify-between p-2 rounded-md border text-sm transition-colors ${
                          isSelected
                            ? 'border-orange-500 bg-orange-50 text-orange-700'
                            : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <span>{topping.name}</span>
                        <span>+{formatPrice(topping.price)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quantity */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Quantity</h4>
                <div className="flex items-center space-x-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    <MinusIcon className="h-4 w-4" />
                  </Button>
                  <span className="font-medium">{quantity}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    <PlusIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="space-y-3">
        <div className="flex items-center justify-between w-full">
          <div className="text-lg font-bold text-gray-900">
            {formatPrice(totalPrice * quantity)}
          </div>
          <div className="text-sm text-gray-500">
            Base: {formatPrice(pizza.basePrice * selectedSize.priceMultiplier)}
          </div>
        </div>

        <div className="flex gap-2 w-full">
          {!isCustomizing ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCustomizing(true)}
                className="flex-1"
              >
                Customize
              </Button>
              <Button
                onClick={() => handleAddToCart()}
                disabled={!pizza.isAvailable}
                className="flex-1"
              >
                Add to Cart
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCustomizing(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddToCart}
                disabled={!pizza.isAvailable}
                className="flex-1"
              >
                Add {quantity} to Cart
              </Button>
            </>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}