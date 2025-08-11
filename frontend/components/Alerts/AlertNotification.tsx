'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { websocketService } from '../../services/websocket.service';
import { Ticker } from '../../../shared/types/ticker.types';

interface TriggeredAlert {
  id: string;
  symbol: string;
  type: 'above' | 'below';
  threshold: number;
  currentPrice: number;
  timestamp: string;
  message: string;
}

interface AlertEventData {
  alert?: {
    id?: string;
    symbol: string;
    type: 'above' | 'below';
    threshold: number;
    triggeredAt?: string;
  };
  ticker?: Ticker;
  message?: string;
}

interface AlertNotificationProps {
  tickers: Ticker[];
}

export const AlertNotification: React.FC<AlertNotificationProps> = ({ tickers }) => {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<TriggeredAlert[]>([]);
  const [showNotifications, setShowNotifications] = useState(true);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  // Check notification permission on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);


  useEffect(() => {
    // Always listen for WebSocket alerts, regardless of authentication
    // We'll check authentication when displaying
    // Set up WebSocket alert listener
    
    // Listen for alert events from WebSocket
    const handleAlertTriggered = (event: { data?: AlertEventData }) => {
      // Only process if authenticated
      if (!isAuthenticated) {
        // Skipping alert - not authenticated
        return;
      }
      
      const data = event.data;
      
      // Handle backend alert format
      if (data && data.alert) {
        // Process alert data
        const alert = data.alert;
        const ticker = data.ticker || tickers.find(t => t.symbol === alert.symbol);
        
        if (ticker) {
          const notification: TriggeredAlert = {
            id: alert.id || `${alert.symbol}-${Date.now()}`,
            symbol: alert.symbol,
            type: alert.type,
            threshold: alert.threshold,
            currentPrice: ticker.price,
            timestamp: alert.triggeredAt || new Date().toISOString(),
            message: data.message || `${alert.symbol} is now ${alert.type} $${alert.threshold.toFixed(2)} at $${ticker.price.toFixed(2)}`
          };

          // Create WebSocket notification
          setNotifications(prev => {
            const newNotifications = [notification, ...prev].slice(0, 5);
            // Updated notifications after WebSocket alert
            return newNotifications;
          });
          
          // Play sound notification
          playAlertSound();
          
          // Show browser notification if permitted
          showBrowserNotification(notification.message);
        } else {
          // Could not find ticker for alert
        }
      } else {
        // Alert event data format not recognized
      }
    };

    // Subscribe to alert events
    websocketService.on('alert', handleAlertTriggered);

    return () => {
      // Clean up WebSocket alert listener
      websocketService.off('alert', handleAlertTriggered);
    };
  }, [isAuthenticated, tickers]); // Keep dependencies for proper updates

  // Remove demo notifications - they interfere with real alerts
  // Real alerts from the backend will be used instead

  const playAlertSound = () => {
    // Create a simple beep sound using Web Audio API
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioContext = new AudioContextClass();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800; // Frequency in Hz
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      // Could not play alert sound - silently handle
    }
  };

  const showBrowserNotification = (message: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Price Alert Triggered!', {
        body: message,
        icon: '/favicon.ico',
        tag: 'price-alert',
      });
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === 'granted') {
        // Show a test notification to confirm it's working
        new Notification('Notifications Enabled! 🎉', {
          body: 'You will now receive desktop notifications for price alerts.',
          icon: '/favicon.ico',
        });
      }
    }
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  if (!isAuthenticated) return null;

  // Render notification panel

  return (
    <>
      {/* Floating Notification Panel - Responsive */}
      {showNotifications && notifications.length > 0 ? (
        <div className="fixed top-20 right-4 left-4 sm:left-auto z-50 max-w-[420px] sm:w-[420px] space-y-3">
          {notifications.map((notification, index) => {
            const priceChange = notification.currentPrice - notification.threshold;
            const percentChange = (priceChange / notification.threshold) * 100;
            
            return (
              <div
                key={notification.id}
                className={`
                  relative overflow-hidden rounded-xl shadow-2xl transform transition-all duration-500
                  ${index === 0 ? 'scale-105' : 'scale-100 opacity-95'}
                `}
                style={{
                  animation: index === 0 ? 'slideIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)' : undefined,
                }}
              >
                {/* Gradient Background */}
                <div className={`absolute inset-0 bg-gradient-to-r ${
                  notification.type === 'above'
                    ? 'from-green-900/90 via-green-800/80 to-green-900/90'
                    : 'from-red-900/90 via-red-800/80 to-red-900/90'
                }`} />
                
                {/* Animated Glow Effect for Latest Alert */}
                {index === 0 && (
                  <div className={`absolute inset-0 ${
                    notification.type === 'above' ? 'bg-green-500/20' : 'bg-red-500/20'
                  } animate-pulse`} />
                )}
                
                {/* Content */}
                <div className="relative bg-gray-900/60 backdrop-blur-sm border border-gray-700/50 p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      {/* Animated Icon */}
                      <div className={`relative ${index === 0 ? 'animate-bounce' : ''}`}>
                        <div className={`absolute inset-0 rounded-full blur-lg ${
                          notification.type === 'above' ? 'bg-green-500/50' : 'bg-red-500/50'
                        }`} />
                        <div className={`relative w-12 h-12 rounded-full flex items-center justify-center ${
                          notification.type === 'above' 
                            ? 'bg-gradient-to-br from-green-400 to-green-600' 
                            : 'bg-gradient-to-br from-red-400 to-red-600'
                        }`}>
                          <span className="text-white text-xl">
                            {notification.type === 'above' ? '↗' : '↘'}
                          </span>
                        </div>
                      </div>
                      
                      {/* Symbol and Type */}
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="text-white font-bold text-lg">{notification.symbol}</h4>
                          <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                            notification.type === 'above'
                              ? 'bg-green-500/30 text-green-300 border border-green-500/50'
                              : 'bg-red-500/30 text-red-300 border border-red-500/50'
                          }`}>
                            {notification.type === 'above' ? 'ABOVE' : 'BELOW'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Alert Triggered • {new Date(notification.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    
                    {/* Close Button */}
                    <button
                      onClick={() => dismissNotification(notification.id)}
                      className="text-gray-500 hover:text-white transition-all hover:rotate-90 duration-300"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  {/* Price Information */}
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div className="bg-gray-800/50 rounded-lg p-2.5">
                      <p className="text-xs text-gray-400 mb-1">Threshold</p>
                      <p className="font-mono font-semibold text-white">
                        ${notification.threshold.toFixed(2)}
                      </p>
                    </div>
                    <div className={`rounded-lg p-2.5 ${
                      notification.type === 'above'
                        ? 'bg-green-900/30 border border-green-500/30'
                        : 'bg-red-900/30 border border-red-500/30'
                    }`}>
                      <p className="text-xs text-gray-400 mb-1">Current Price</p>
                      <p className="font-mono font-bold text-lg text-white">
                        ${notification.currentPrice.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  
                  {/* Price Change Bar */}
                  <div className="bg-gray-800/50 rounded-lg p-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-400">Price Movement</span>
                      <span className={`text-xs font-semibold ${
                        notification.type === 'above' ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)} ({percentChange >= 0 ? '+' : ''}{percentChange.toFixed(2)}%)
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${
                          notification.type === 'above'
                            ? 'bg-gradient-to-r from-green-500 to-green-400'
                            : 'bg-gradient-to-r from-red-500 to-red-400'
                        }`}
                        style={{ width: `${Math.min(100, Math.abs(percentChange) * 10)}%` }}
                      />
                    </div>
                  </div>
                  
                  {/* Alert Label for First Notification */}
                  {index === 0 && (
                    <div className="absolute top-2 right-12 px-2 py-0.5 bg-yellow-500/90 text-yellow-900 text-xs font-bold rounded animate-pulse">
                      NEW
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          
          {/* Enable Notifications Button */}
          {typeof window !== 'undefined' && 'Notification' in window && notificationPermission === 'default' && (
            <div className="mt-3 p-4 bg-gradient-to-r from-blue-600/20 to-blue-700/20 border border-blue-500/30 rounded-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">🔔</span>
                  <div>
                    <p className="text-sm font-semibold text-white">Enable Desktop Notifications</p>
                    <p className="text-xs text-gray-400">Get notified when alerts trigger</p>
                  </div>
                </div>
                <button
                  onClick={requestNotificationPermission}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-medium rounded-lg transition-all transform hover:scale-105 shadow-lg"
                >
                  Enable
                </button>
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* Toggle Button */}
      {notifications.length > 0 && !showNotifications && (
        <button
          onClick={() => setShowNotifications(!showNotifications)}
          className="fixed top-20 right-4 z-50 p-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-xl shadow-xl transition-all transform hover:scale-110 animate-bounce"
        >
          <span className="relative flex items-center justify-center">
            <span className="text-2xl">🔔</span>
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse flex items-center justify-center">
              <span className="text-white text-xs font-bold">{notifications.length}</span>
            </span>
          </span>
        </button>
      )}

      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
};