import 'jest';
import request from 'supertest';
import express, { Response, NextFunction } from 'express';
import { alertsService } from '../../src/services/alerts.service';

// Mock the auth middleware before importing the router
jest.mock('../../src/middleware/auth.middleware', () => ({
  authenticateToken: (req: any, _res: Response, next: NextFunction) => {
    req.user = { id: 'test-user-id', email: 'test@example.com' };
    next();
  },
  AuthRequest: {}
}));

// Import the router after mocking
import alertsRouter from '../../src/routes/alerts.routes';

const app = express();
app.use(express.json());
app.use('/api/alerts', alertsRouter);

describe('Alerts Routes', () => {
  beforeEach(() => {
    // Clear all alerts before each test to ensure clean state
    jest.clearAllMocks();
    // Reset the alerts service to clear any state
    const alerts = alertsService.getUserAlerts('test-user-id');
    alerts.forEach(alert => {
      alertsService.deleteAlert('test-user-id', alert.id);
    });
  });

  afterEach(() => {
    // Clean up after each test as well
    const alerts = alertsService.getUserAlerts('test-user-id');
    alerts.forEach(alert => {
      alertsService.deleteAlert('test-user-id', alert.id);
    });
  });

  describe('GET /api/alerts', () => {
    it('should return user alerts', async () => {
      // Create some test alerts
      alertsService.createAlert('test-user-id', 'AAPL', 'above', 150);
      alertsService.createAlert('test-user-id', 'TSLA', 'below', 200);

      const response = await request(app)
        .get('/api/alerts')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(2);
    });

    it('should return empty array when no alerts', async () => {
      const response = await request(app)
        .get('/api/alerts')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toEqual([]);
    });
  });

  describe('POST /api/alerts', () => {
    it('should create a new alert', async () => {
      const response = await request(app)
        .post('/api/alerts')
        .send({
          symbol: 'AAPL',
          type: 'above',
          threshold: 150
        })
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('symbol', 'AAPL');
      expect(response.body.data).toHaveProperty('type', 'above');
      expect(response.body.data).toHaveProperty('threshold', 150);
      expect(response.body.data).toHaveProperty('active', true);
    });

    it('should fail with missing fields', async () => {
      const response = await request(app)
        .post('/api/alerts')
        .send({
          symbol: 'AAPL'
        })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Symbol, type, and threshold are required');
    });

    it('should fail with invalid type', async () => {
      const response = await request(app)
        .post('/api/alerts')
        .send({
          symbol: 'AAPL',
          type: 'invalid',
          threshold: 150
        })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Type must be either "above" or "below"');
    });

    it('should create alert even with string threshold that can be converted to number', async () => {
      const response = await request(app)
        .post('/api/alerts')
        .send({
          symbol: 'AAPL',
          type: 'above',
          threshold: '150'
        })
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('threshold');
    });
  });

  describe('PATCH /api/alerts/:alertId/toggle', () => {
    it('should toggle alert status', async () => {
      const alert = alertsService.createAlert('test-user-id', 'AAPL', 'above', 150);
      expect(alert.active).toBe(true);

      const response = await request(app)
        .patch(`/api/alerts/${alert.id}/toggle`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('active', false);

      // Toggle again
      const response2 = await request(app)
        .patch(`/api/alerts/${alert.id}/toggle`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response2.body.data).toHaveProperty('active', true);
    });

    it('should return 404 for non-existent alert', async () => {
      const response = await request(app)
        .patch('/api/alerts/non-existent/toggle')
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Alert not found');
    });
  });

  describe('DELETE /api/alerts/:alertId', () => {
    it('should delete an alert', async () => {
      const alert = alertsService.createAlert('test-user-id', 'AAPL', 'above', 150);

      const response = await request(app)
        .delete(`/api/alerts/${alert.id}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Alert deleted successfully');

      // Verify it's deleted
      const alerts = alertsService.getUserAlerts('test-user-id');
      expect(alerts.find(a => a.id === alert.id)).toBeUndefined();
    });

    it('should return 404 for non-existent alert', async () => {
      const response = await request(app)
        .delete('/api/alerts/non-existent')
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Alert not found');
    });
  });
});