'use client';

import React, { useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LoginModal } from './LoginModal';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const [showLogin, setShowLogin] = React.useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setShowLogin(true);
    }
  }, [isLoading, isAuthenticated]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <h2 className="text-3xl font-bold text-white mb-4">Welcome to Trading Dashboard</h2>
          <p className="text-gray-400 mb-8">
            Please login to access real-time market data and manage your price alerts.
          </p>
          <button
            onClick={() => setShowLogin(true)}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Login to Continue
          </button>
          <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
        </div>
      </div>
    );
  }

  return <>{children}</>;
};