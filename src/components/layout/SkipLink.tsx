// src/components/layout/SkipLink.tsx
'use client';

import React from 'react';
import Link from 'next/link';

export function SkipLink() {
  return (
    <Link
      href="#main"
      className="skip-link sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-[60] bg-blue-600 text-white px-4 py-2 rounded-md font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      onFocus={() => {
        // Ensure the link is visible when focused
        const element = document.activeElement as HTMLElement;
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }}
    >
      Skip to main content
    </Link>
  );
}
