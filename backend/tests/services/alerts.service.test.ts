import { AlertsService } from '../../src/services/alerts.service';
import { Ticker } from '../../../shared/types/ticker.types';

describe('AlertsService', () => {
  let alertsService: AlertsService;

  beforeEach(() => {
    alertsService = new AlertsService();
  });

  afterEach(() => {
    // Clean up all alerts - using private method workaround for tests
    // In a real test, we'd expose a reset method or use mocks
  });

  describe('createAlert', () => {
    it('should create a new alert', () => {
      const alert = alertsService.createAlert('user1', 'AAPL', 'above', 150);
      
      expect(alert).toBeDefined();
      expect(alert.id).toBeDefined();
      expect(alert.symbol).toBe('AAPL');
      expect(alert.type).toBe('above');
      expect(alert.threshold).toBe(150);
      expect(alert.active).toBe(true);
      expect(alert.createdAt).toBeDefined();
    });

    it('should add alert to the list', () => {
      const initialCount = alertsService.getUserAlerts('user1').length;
      alertsService.createAlert('user1', 'TSLA', 'below', 200);
      
      const alerts = alertsService.getUserAlerts('user1');
      expect(alerts.length).toBe(initialCount + 1);
    });

    it('should create alerts with unique IDs', () => {
      const alert1 = alertsService.createAlert('user1', 'AAPL', 'above', 150);
      const alert2 = alertsService.createAlert('user1', 'AAPL', 'above', 150);
      
      expect(alert1.id).not.toBe(alert2.id);
    });
  });

  describe('getUserAlerts', () => {
    it('should return all alerts for a user', () => {
      alertsService.createAlert('user1', 'AAPL', 'above', 150);
      alertsService.createAlert('user1', 'TSLA', 'below', 200);
      alertsService.createAlert('user1', 'BTC-USD', 'above', 50000);
      
      const alerts = alertsService.getUserAlerts('user1');
      expect(alerts.length).toBe(3);
    });

    it('should return empty array when no alerts', () => {
      const alerts = alertsService.getUserAlerts('user1');
      expect(alerts).toEqual([]);
    });
  });

  describe('getUserAlerts', () => {
    it('should return specific user alerts', () => {
      const created = alertsService.createAlert('user1', 'AAPL', 'above', 150);
      const alerts = alertsService.getUserAlerts('user1');
      
      expect(alerts).toContainEqual(created);
    });

    it('should return empty array for user with no alerts', () => {
      const alerts = alertsService.getUserAlerts('non-existent-user');
      expect(alerts).toEqual([]);
    });
  });

  describe('deleteAlert', () => {
    it('should delete an alert', () => {
      const alert = alertsService.createAlert('user1', 'AAPL', 'above', 150);
      const deleted = alertsService.deleteAlert('user1', alert.id);
      
      expect(deleted).toBe(true);
      const alerts = alertsService.getUserAlerts('user1');
      expect(alerts.find(a => a.id === alert.id)).toBeUndefined();
    });

    it('should return false for non-existent alert', () => {
      const deleted = alertsService.deleteAlert('user1', 'non-existent');
      expect(deleted).toBe(false);
    });

    it('should remove alert from the list', () => {
      const alert = alertsService.createAlert('user1', 'AAPL', 'above', 150);
      const initialCount = alertsService.getUserAlerts('user1').length;
      
      alertsService.deleteAlert('user1', alert.id);
      
      const alerts = alertsService.getUserAlerts('user1');
      expect(alerts.length).toBe(initialCount - 1);
    });
  });

  describe('toggleAlert', () => {
    it('should toggle alert active status', () => {
      const alert = alertsService.createAlert('user1', 'AAPL', 'above', 150);
      expect(alert.active).toBe(true);
      
      const toggled = alertsService.toggleAlert('user1', alert.id);
      expect(toggled?.active).toBe(false);
      
      const toggledAgain = alertsService.toggleAlert('user1', alert.id);
      expect(toggledAgain?.active).toBe(true);
    });

    it('should return null for non-existent alert', () => {
      const toggled = alertsService.toggleAlert('user1', 'non-existent');
      expect(toggled).toBeNull();
    });
  });

  describe('checkAlerts', () => {
    it('should trigger alert when price crosses threshold (above)', (done) => {
      const alert = alertsService.createAlert('user1', 'AAPL', 'above', 150);
      
      alertsService.on('alert-triggered', (event) => {
        expect(event.alert).toEqual(alert);
        expect(event.ticker.symbol).toBe('AAPL');
        expect(event.ticker.price).toBeGreaterThanOrEqual(150);
        done();
      });
      
      const ticker: Ticker = {
        symbol: 'AAPL',
        name: 'Apple Inc.',
        price: 151,
        change: 1,
        changePercent: 0.67,
        volume: 1000000,
        high: 152,
        low: 149,
        previousClose: 150,
        timestamp: new Date().toISOString()
      };
      
      alertsService.checkAlerts(ticker);
    });

    it('should trigger alert when price crosses threshold (below)', (done) => {
      const alert = alertsService.createAlert('user1', 'TSLA', 'below', 200);
      
      alertsService.on('alert-triggered', (event) => {
        expect(event.alert).toEqual(alert);
        expect(event.ticker.symbol).toBe('TSLA');
        expect(event.ticker.price).toBeLessThanOrEqual(200);
        done();
      });
      
      const ticker: Ticker = {
        symbol: 'TSLA',
        name: 'Tesla Inc.',
        price: 199,
        change: -5,
        changePercent: -2.5,
        volume: 1000000,
        high: 205,
        low: 198,
        previousClose: 204,
        timestamp: new Date().toISOString()
      };
      
      alertsService.checkAlerts(ticker);
    });

    it('should not trigger inactive alerts', () => {
      const alert = alertsService.createAlert('user1', 'AAPL', 'above', 150);
      alertsService.toggleAlert('user1', alert.id); // Make inactive
      
      let triggered = false;
      alertsService.on('alert-triggered', () => {
        triggered = true;
      });
      
      const ticker: Ticker = {
        symbol: 'AAPL',
        name: 'Apple Inc.',
        price: 151,
        change: 1,
        changePercent: 0.67,
        volume: 1000000,
        high: 152,
        low: 149,
        previousClose: 150,
        timestamp: new Date().toISOString()
      };
      
      alertsService.checkAlerts(ticker);
      expect(triggered).toBe(false);
    });

    it('should not trigger already triggered alerts', () => {
      alertsService.createAlert('user1', 'AAPL', 'above', 150);
      
      let triggerCount = 0;
      alertsService.on('alert-triggered', () => {
        triggerCount++;
      });
      
      const ticker: Ticker = {
        symbol: 'AAPL',
        name: 'Apple Inc.',
        price: 151,
        change: 1,
        changePercent: 0.67,
        volume: 1000000,
        high: 152,
        low: 149,
        previousClose: 150,
        timestamp: new Date().toISOString()
      };
      
      // First check should trigger
      alertsService.checkAlerts(ticker);
      expect(triggerCount).toBe(1);
      
      // Second check should not trigger
      alertsService.checkAlerts(ticker);
      expect(triggerCount).toBe(1);
    });

    it('should only check alerts for matching symbol', () => {
      alertsService.createAlert('user1', 'AAPL', 'above', 150);
      alertsService.createAlert('user1', 'TSLA', 'below', 200);
      
      let triggered = false;
      alertsService.on('alert-triggered', (event) => {
        if (event.ticker.symbol === 'TSLA') {
          triggered = true;
        }
      });
      
      const ticker: Ticker = {
        symbol: 'AAPL',
        name: 'Apple Inc.',
        price: 151,
        change: 1,
        changePercent: 0.67,
        volume: 1000000,
        high: 152,
        low: 149,
        previousClose: 150,
        timestamp: new Date().toISOString()
      };
      
      alertsService.checkAlerts(ticker);
      expect(triggered).toBe(false);
    });
  });

  describe('event emission', () => {
    it('should emit alert-triggered event with correct data', (done) => {
      alertsService.createAlert('user1', 'AAPL', 'above', 150);
      
      alertsService.on('alert-triggered', (event) => {
        expect(event).toHaveProperty('alert');
        expect(event).toHaveProperty('ticker');
        expect(event).toHaveProperty('message');
        expect(event.message).toContain('AAPL');
        expect(event.message).toContain('above');
        expect(event.message).toContain('150');
        done();
      });
      
      const ticker: Ticker = {
        symbol: 'AAPL',
        name: 'Apple Inc.',
        price: 151,
        change: 1,
        changePercent: 0.67,
        volume: 1000000,
        high: 152,
        low: 149,
        previousClose: 150,
        timestamp: new Date().toISOString()
      };
      
      alertsService.checkAlerts(ticker);
    });
  });
});