import { EventEmitter } from 'events';
import { Ticker } from '../../../shared/types/ticker.types';
import { logger } from '../utils/logger';

export interface PriceAlert {
  id: string;
  userId: string;
  symbol: string;
  type: 'above' | 'below';
  threshold: number;
  active: boolean;
  triggeredAt?: string;
  createdAt: string;
}

export class AlertsService extends EventEmitter {
  private alerts: Map<string, PriceAlert[]> = new Map();
  private alertIdCounter = 1;

  constructor() {
    super();
  }

  // Create a new price alert
  createAlert(userId: string, symbol: string, type: 'above' | 'below', threshold: number): PriceAlert {
    const alert: PriceAlert = {
      id: `alert_${this.alertIdCounter++}`,
      userId,
      symbol,
      type,
      threshold,
      active: true,
      createdAt: new Date().toISOString()
    };

    const userAlerts = this.alerts.get(userId) || [];
    userAlerts.push(alert);
    this.alerts.set(userId, userAlerts);

    // Alert created
    return alert;
  }

  // Get all alerts for a user
  getUserAlerts(userId: string): PriceAlert[] {
    return this.alerts.get(userId) || [];
  }

  // Get active alerts for a symbol
  getSymbolAlerts(symbol: string): PriceAlert[] {
    const allAlerts: PriceAlert[] = [];
    this.alerts.forEach(userAlerts => {
      const symbolAlerts = userAlerts.filter(alert => 
        alert.symbol === symbol && alert.active
      );
      allAlerts.push(...symbolAlerts);
    });
    return allAlerts;
  }

  // Delete an alert
  deleteAlert(userId: string, alertId: string): boolean {
    const userAlerts = this.alerts.get(userId);
    if (!userAlerts) return false;

    const index = userAlerts.findIndex(alert => alert.id === alertId);
    if (index === -1) return false;

    userAlerts.splice(index, 1);
    this.alerts.set(userId, userAlerts);
    logger.info(`Alert deleted: ${alertId}`);
    return true;
  }

  // Toggle alert active status
  toggleAlert(userId: string, alertId: string): PriceAlert | null {
    const userAlerts = this.alerts.get(userId);
    if (!userAlerts) return null;

    const alert = userAlerts.find(a => a.id === alertId);
    if (!alert) return null;

    alert.active = !alert.active;
    logger.info(`Alert ${alertId} is now ${alert.active ? 'active' : 'inactive'}`);
    return alert;
  }

  // Check if any alerts should be triggered
  checkAlerts(ticker: Ticker): PriceAlert[] {
    const triggeredAlerts: PriceAlert[] = [];
    const symbolAlerts = this.getSymbolAlerts(ticker.symbol);

    for (const alert of symbolAlerts) {
      if (!alert.active || alert.triggeredAt) continue;

      const shouldTrigger = 
        (alert.type === 'above' && ticker.price >= alert.threshold) ||
        (alert.type === 'below' && ticker.price <= alert.threshold);

      if (shouldTrigger) {
        alert.triggeredAt = new Date().toISOString();
        alert.active = false; // Deactivate after triggering
        triggeredAlerts.push(alert);

        // Emit alert event for backend handling
        const eventData = {
          alert,
          ticker,
          message: `🚨 Alert: ${ticker.symbol} is now ${alert.type} ${alert.threshold} at ${ticker.price.toFixed(2)}`
        };
        
        logger.info(`Alert triggered: ${alert.id} - ${ticker.symbol} ${alert.type} ${alert.threshold}`);
        
        this.emit('alert-triggered', eventData);
      }
    }

    return triggeredAlerts;
  }

  // Get alert statistics
  getAlertStats() {
    let totalAlerts = 0;
    let activeAlerts = 0;
    let triggeredAlerts = 0;

    this.alerts.forEach(userAlerts => {
      totalAlerts += userAlerts.length;
      activeAlerts += userAlerts.filter(a => a.active).length;
      triggeredAlerts += userAlerts.filter(a => a.triggeredAt).length;
    });

    return {
      total: totalAlerts,
      active: activeAlerts,
      triggered: triggeredAlerts,
      users: this.alerts.size
    };
  }
}

export const alertsService = new AlertsService();