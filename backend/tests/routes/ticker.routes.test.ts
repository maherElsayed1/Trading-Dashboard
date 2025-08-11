import request from 'supertest';
import express from 'express';
import { createTickerRoutes } from '../../src/routes/ticker.routes';
import { marketDataService } from '../../src/services/marketData.service';

const app = express();
app.use(express.json());
const tickerRoutes = createTickerRoutes(marketDataService);
app.use('/api', tickerRoutes);

describe('Ticker Routes', () => {
  beforeAll(() => {
    // Start market simulation for testing
    marketDataService.startMarketSimulation();
  });

  afterAll(() => {
    // Stop market simulation
    marketDataService.stopMarketSimulation();
  });

  describe('GET /api/tickers', () => {
    it('should return all tickers', async () => {
      const response = await request(app)
        .get('/api/tickers')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      
      const ticker = response.body.data[0];
      expect(ticker).toHaveProperty('symbol');
      expect(ticker).toHaveProperty('name');
      expect(ticker).toHaveProperty('price');
    });
  });

  describe('GET /api/tickers/:symbol', () => {
    it('should return a specific ticker', async () => {
      const response = await request(app)
        .get('/api/tickers/AAPL')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('symbol', 'AAPL');
      expect(response.body.data).toHaveProperty('name', 'Apple Inc.');
      expect(response.body.data).toHaveProperty('price');
    });

    it('should return 404 for invalid ticker', async () => {
      const response = await request(app)
        .get('/api/tickers/INVALID')
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/tickers/:symbol/history', () => {
    it('should return historical data for a ticker', async () => {
      const response = await request(app)
        .get('/api/tickers/AAPL/history')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      
      if (response.body.data.length > 0) {
        const dataPoint = response.body.data[0];
        expect(dataPoint).toHaveProperty('timestamp');
        expect(dataPoint).toHaveProperty('open');
        expect(dataPoint).toHaveProperty('high');
        expect(dataPoint).toHaveProperty('low');
        expect(dataPoint).toHaveProperty('close');
        expect(dataPoint).toHaveProperty('volume');
      }
    });

    it('should return 404 for invalid ticker history', async () => {
      const response = await request(app)
        .get('/api/tickers/INVALID/history')
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/market/status', () => {
    it('should return market status', async () => {
      const response = await request(app)
        .get('/api/market/status')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('isOpen');
      expect(response.body.data).toHaveProperty('updateFrequency');
      expect(response.body.data).toHaveProperty('totalSubscriptions');
      expect(response.body.data).toHaveProperty('tickerCount');
    });
  });
});