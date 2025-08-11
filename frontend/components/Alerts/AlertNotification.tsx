'use client';

import React, { useState, useEffect, useRef } from 'react';
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

interface AlertNotificationProps {
  tickers: Ticker[];
}

export const AlertNotification: React.FC<AlertNotificationProps> = ({ tickers }) => {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<TriggeredAlert[]>([]);
  const [showNotifications, setShowNotifications] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    // Listen for alert events from WebSocket
    const handleAlertTriggered = (event: any) => {
      const data = event.data;
      
      // Handle backend alert format
      if (data && data.alert) {
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

          setNotifications(prev => [notification, ...prev].slice(0, 5)); // Keep last 5 notifications
          
          // Play sound notification
          playAlertSound();
          
          // Show browser notification if permitted
          showBrowserNotification(notification.message);
        }
      }
    };

    // Subscribe to alert events
    websocketService.on('alert', handleAlertTriggered);

    return () => {
      websocketService.off('alert', handleAlertTriggered);
    };
  }, [isAuthenticated, tickers]);

  // Simulate alerts for demonstration
  useEffect(() => {
    if (!isAuthenticated || tickers.length === 0) return;

    // Create demo alerts after 5 seconds
    const demoTimeout = setTimeout(() => {
      const appleTicker = tickers.find(t => t.symbol === 'AAPL');
      if (appleTicker) {
        const demoAlert: TriggeredAlert = {
          id: 'demo-1',
          symbol: 'AAPL',
          type: 'above',
          threshold: appleTicker.price - 1,
          currentPrice: appleTicker.price,
          timestamp: new Date().toISOString(),
          message: `🎯 DEMO: AAPL crossed above $${(appleTicker.price - 1).toFixed(2)} - Current: $${appleTicker.price.toFixed(2)}`
        };
        setNotifications([demoAlert]);
        playAlertSound();
      }
    }, 5000);

    // Create another demo alert after 10 seconds
    const demoTimeout2 = setTimeout(() => {
      const btcTicker = tickers.find(t => t.symbol === 'BTC-USD');
      if (btcTicker) {
        const demoAlert: TriggeredAlert = {
          id: 'demo-2',
          symbol: 'BTC-USD',
          type: 'below',
          threshold: btcTicker.price + 1000,
          currentPrice: btcTicker.price,
          timestamp: new Date().toISOString(),
          message: `📉 DEMO: BTC-USD dropped below $${(btcTicker.price + 1000).toFixed(2)} - Current: $${btcTicker.price.toFixed(2)}`
        };
        setNotifications(prev => [demoAlert, ...prev].slice(0, 5));
        playAlertSound();
      }
    }, 10000);

    return () => {
      clearTimeout(demoTimeout);
      clearTimeout(demoTimeout2);
    };
  }, [isAuthenticated, tickers]);

  const playAlertSound = () => {
    // Create a simple beep sound using Web Audio API
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
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
      console.error('Could not play alert sound:', error);
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
      await Notification.requestPermission();
    }
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  if (!isAuthenticated || notifications.length === 0) return null;

  return (
    <>
      {/* Floating Notification Panel */}
      {showNotifications && (
        <div className="fixed top-20 right-4 z-50 w-96 space-y-2">
          {notifications.map((notification, index) => (
            <div
              key={notification.id}
              className={`
                bg-gray-900 border rounded-lg p-4 shadow-xl transform transition-all duration-500
                ${index === 0 ? 'scale-105 animate-pulse' : ''}
                ${notification.type === 'above' 
                  ? 'border-green-500 bg-green-900/20' 
                  : 'border-red-500 bg-red-900/20'
                }
              `}
              style={{
                animation: index === 0 ? 'slideIn 0.5s ease-out' : undefined,
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className={`text-2xl ${
                      notification.type === 'above' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {notification.type === 'above' ? '📈' : '📉'}
                    </span>
                    <h4 className="text-white font-bold">{notification.symbol}</h4>
                    <span className={`px-2 py-1 text-xs rounded ${
                      notification.type === 'above'
                        ? 'bg-green-900/50 text-green-400'
                        : 'bg-red-900/50 text-red-400'
                    }`}>
                      {notification.type.toUpperCase()}
                    </span>
                  </div>
                  
                  <p className="text-gray-300 text-sm mb-1">
                    Threshold: <span className="font-mono">${notification.threshold.toFixed(2)}</span>
                  </p>
                  <p className="text-gray-300 text-sm mb-2">
                    Current: <span className="font-mono font-bold text-white">${notification.currentPrice.toFixed(2)}</span>
                  </p>
                  
                  <p className="text-xs text-gray-500">
                    {new Date(notification.timestamp).toLocaleTimeString()}
                  </p>
                </div>
                
                <button
                  onClick={() => dismissNotification(notification.id)}
                  className="text-gray-400 hover:text-white transition-colors ml-4"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
          
          {/* Enable Notifications Button */}
          {typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default' && (
            <button
              onClick={requestNotificationPermission}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Enable Desktop Notifications
            </button>
          )}
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => setShowNotifications(!showNotifications)}
        className="fixed top-20 right-4 z-50 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
        style={{ display: notifications.length > 0 && !showNotifications ? 'block' : 'none' }}
      >
        <span className="relative">
          🔔
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
        </span>
      </button>

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