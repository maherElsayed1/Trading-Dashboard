'use client';

import React from 'react';
import { Header } from './Header';

interface LayoutProps {
  children: React.ReactNode;
  isConnected: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ children, isConnected }) => {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Header isConnected={isConnected} />
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
};