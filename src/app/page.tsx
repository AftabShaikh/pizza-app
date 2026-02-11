'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { SkipLink } from '@/components/layout/SkipLink';
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
      <SkipLink />
      <Navbar />
      
      {/* Hero Section */}
      <header className="bg-gradient-to-r from-orange-500 to-red-600 text-white py-16">
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
      </header>

      {/* Main Content */}
      <main id="main" tabIndex={-1} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Category Filter Section */}
        <section aria-labelledby="category-heading">
          <h2 id="category-heading" className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Choose Your Pizza Category
          </h2>
          <div className="flex flex-wrap gap-4 justify-center mb-8" role="group" aria-labelledby="category-heading">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-6 py-2 rounded-full font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${
                  selectedCategory === category
                    ? 'bg-orange-700 text-white accessible-orange' // Darker orange for better contrast
                    : 'bg-white text-gray-700 hover:bg-orange-100 border border-gray-300'
                }`}
                aria-pressed={selectedCategory === category}
                aria-label={`Filter pizzas by ${category} category${selectedCategory === category ? ' (currently selected)' : ''}`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        </section>

        {/* Pizza Grid Section */}
        <section aria-labelledby="pizza-menu-heading">
          <h2 id="pizza-menu-heading" className="text-2xl font-bold text-gray-900 mb-6 text-center">
            {selectedCategory === 'all' 
              ? 'Our Complete Menu' 
              : `${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} Pizzas`}
          </h2>
          
          <div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            role="grid"
            aria-label={`Pizza menu showing ${filteredPizzas.length} pizzas`}
          >
            {filteredPizzas.map((pizza, index) => (
              <div key={pizza.id} role="gridcell" aria-describedby={`pizza-${pizza.id}-description`}>
                <h3 className="sr-only" id={`pizza-${pizza.id}-name`}>
                  {pizza.name} Pizza
                </h3>
                <PizzaCard
                  pizza={pizza}
                  sizes={sizes}
                  toppings={toppings}
                />
              </div>
            ))}
          </div>

          {filteredPizzas.length === 0 && (
            <div className="text-center py-12" role="status" aria-live="polite">
              <p className="text-gray-500 text-lg">
                No pizzas available in the {selectedCategory} category.
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
