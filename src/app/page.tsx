'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { PizzaCard } from '@/components/pizza/PizzaCard';
import { Pizza, PizzaSize, Topping } from '@/types';
import pizzasData from '@/data/pizzas.json';
import sizesData from '@/data/sizes.json';
import toppingsData from '@/data/toppings.json';

export default function Home() {
  const [pizzas, setPizzas] = useState<Pizza[]>([]);
  const [sizes, setSizes] = useState<PizzaSize[]>([]);
  const [toppings, setToppings] = useState<Topping[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    setPizzas(pizzasData as Pizza[]);
    setSizes(sizesData as PizzaSize[]);
    setToppings(toppingsData as Topping[]);
  }, []);

  const categories = ['all', ...Array.from(new Set(pizzas.map(pizza => pizza.category)))];
  const filteredPizzas = selectedCategory === 'all' 
    ? pizzas.filter(pizza => pizza.isAvailable)
    : pizzas.filter(pizza => pizza.category === selectedCategory && pizza.isAvailable);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-orange-500 to-red-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            Welcome to Pizza Palace
          </h1>
          <p className="text-xl md:text-2xl mb-8">
            Fresh, handcrafted pizzas delivered to your door
          </p>
          <div className="flex justify-center">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 inline-block">
              <p className="text-lg">
                🍕 Free delivery on orders over $25
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-wrap gap-4 justify-center mb-8">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-6 py-2 rounded-full font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-orange-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-orange-100 border border-gray-300'
              }`}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>

        {/* Pizza Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPizzas.map((pizza) => (
            <PizzaCard
              key={pizza.id}
              pizza={pizza}
              sizes={sizes}
              toppings={toppings}
            />
          ))}
        </div>

        {filteredPizzas.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              No pizzas available in this category.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
