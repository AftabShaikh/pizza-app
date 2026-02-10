'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ShoppingCartIcon, UserIcon, Bars3Icon, XMarkIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { useCart } from '@/context/CartContext';
import { useUser } from '@/context/UserContext';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatPrice } from '@/lib/utils';
import { MonitoringDashboard } from '@/components/monitoring/MonitoringDashboard';
import { usePerformanceTracking } from '@/lib/instrumentation/performance';

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showMonitoring, setShowMonitoring] = useState(false);
  const { getTotalItems, getTotalPrice } = useCart();
  const { user, logout } = useUser();

  const totalItems = getTotalItems();
  const totalPrice = getTotalPrice();

  // Track navbar performance
  usePerformanceTracking('Navbar', [totalItems, user]);

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">🍕</span>
            </div>
            <span className="text-xl font-bold text-gray-900">Pizza Palace</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-gray-700 hover:text-orange-600 font-medium">
              Menu
            </Link>
            <Link href="/about" className="text-gray-700 hover:text-orange-600 font-medium">
              About
            </Link>
            <Link href="/contact" className="text-gray-700 hover:text-orange-600 font-medium">
              Contact
            </Link>
            {user && (
              <Link href="/orders" className="text-gray-700 hover:text-orange-600 font-medium">
                My Orders
              </Link>
            )}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Cart */}
            <Link href="/cart" className="relative">
              <Button variant="outline" size="sm" className="flex items-center space-x-2">
                <ShoppingCartIcon className="h-5 w-5" />
                <span>{formatPrice(totalPrice)}</span>
                {totalItems > 0 && (
                  <Badge variant="danger" className="absolute -top-2 -right-2">
                    {totalItems}
                  </Badge>
                )}
              </Button>
            </Link>

            {/* User */}
            <div className="flex items-center space-x-2">
              {/* SRE Monitoring Button (Development only) */}
              {process.env.NODE_ENV === 'development' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowMonitoring(!showMonitoring)}
                  className="flex items-center space-x-2"
                  title="SRE Monitoring Dashboard"
                >
                  <ChartBarIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Monitor</span>
                </Button>
              )}
              
              {user ? (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-700">Hello, {user.name}</span>
                  <Button variant="ghost" size="sm" onClick={logout}>
                    Logout
                  </Button>
                </div>
              ) : (
                <Link href="/login">
                  <Button variant="outline" size="sm" className="flex items-center space-x-2">
                    <UserIcon className="h-4 w-4" />
                    <span>Login</span>
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4 space-y-4">
            <Link
              href="/"
              className="block text-gray-700 hover:text-orange-600 font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              Menu
            </Link>
            <Link
              href="/about"
              className="block text-gray-700 hover:text-orange-600 font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              About
            </Link>
            <Link
              href="/contact"
              className="block text-gray-700 hover:text-orange-600 font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              Contact
            </Link>
            {user && (
              <Link
                href="/orders"
                className="block text-gray-700 hover:text-orange-600 font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                My Orders
              </Link>
            )}
            
            <div className="pt-4 border-t border-gray-200 space-y-4">
              <Link href="/cart" onClick={() => setIsMenuOpen(false)}>
                <Button variant="outline" className="w-full justify-between">
                  <span className="flex items-center space-x-2">
                    <ShoppingCartIcon className="h-5 w-5" />
                    <span>Cart</span>
                  </span>
                  <span className="flex items-center space-x-2">
                    <span>{formatPrice(totalPrice)}</span>
                    {totalItems > 0 && (
                      <Badge variant="danger">{totalItems}</Badge>
                    )}
                  </span>
                </Button>
              </Link>
              
              {user ? (
                <div className="space-y-2">
                  <div className="text-sm text-gray-700">Hello, {user.name}</div>
                  <Button variant="ghost" className="w-full" onClick={logout}>
                    Logout
                  </Button>
                </div>
              ) : (
                <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                  <Button variant="outline" className="w-full">
                    <UserIcon className="h-4 w-4 mr-2" />
                    Login
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>

      {/* SRE Monitoring Dashboard */}
      <MonitoringDashboard
        isVisible={showMonitoring}
        onToggle={() => setShowMonitoring(!showMonitoring)}
      />
    </nav>
  );
}