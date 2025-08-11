import { Router } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware';
import { alertsService } from '../services/alerts.service';
import { MarketDataService } from '../services/marketData.service';

const marketDataService = new MarketDataService();

const router = Router();

/**
 * @swagger
 * /api/alerts:
 *   get:
 *     summary: Get user's alerts
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user alerts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       symbol:
 *                         type: string
 *                       type:
 *                         type: string
 *                         enum: [above, below]
 *                       threshold:
 *                         type: number
 *                       active:
 *                         type: boolean
 *                       triggeredAt:
 *                         type: string
 */
router.get('/', authenticateToken, (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const alerts = alertsService.getUserAlerts(userId);

  res.json({
    success: true,
    data: alerts,
    count: alerts.length
  });
});

/**
 * @swagger
 * /api/alerts:
 *   post:
 *     summary: Create a new price alert
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - symbol
 *               - type
 *               - threshold
 *             properties:
 *               symbol:
 *                 type: string
 *                 example: AAPL
 *               type:
 *                 type: string
 *                 enum: [above, below]
 *                 example: above
 *               threshold:
 *                 type: number
 *                 example: 185.00
 *     responses:
 *       201:
 *         description: Alert created successfully
 */
router.post('/', authenticateToken, (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const { symbol, type, threshold } = req.body;

  if (!symbol || !type || threshold === undefined) {
    res.status(400).json({
      success: false,
      error: 'Symbol, type, and threshold are required'
    });
    return;
  }

  if (type !== 'above' && type !== 'below') {
    res.status(400).json({
      success: false,
      error: 'Type must be either "above" or "below"'
    });
    return;
  }

  const alert = alertsService.createAlert(userId, symbol, type, threshold);

  res.status(201).json({
    success: true,
    data: alert,
    message: `Alert created: ${symbol} ${type} ${threshold}`
  });
});

/**
 * @swagger
 * /api/alerts/{alertId}:
 *   delete:
 *     summary: Delete an alert
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: alertId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Alert deleted successfully
 */
router.delete('/:alertId', authenticateToken, (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const { alertId } = req.params;

  const deleted = alertsService.deleteAlert(userId, alertId);

  if (!deleted) {
    res.status(404).json({
      success: false,
      error: 'Alert not found'
    });
    return;
  }

  res.json({
    success: true,
    message: 'Alert deleted successfully'
  });
});

/**
 * @swagger
 * /api/alerts/{alertId}/toggle:
 *   patch:
 *     summary: Toggle alert active status
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: alertId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Alert toggled successfully
 */
router.patch('/:alertId/toggle', authenticateToken, (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const { alertId } = req.params;

  const alert = alertsService.toggleAlert(userId, alertId);

  if (!alert) {
    res.status(404).json({
      success: false,
      error: 'Alert not found'
    });
    return;
  }

  res.json({
    success: true,
    data: alert,
    message: `Alert is now ${alert.active ? 'active' : 'inactive'}`
  });
});

/**
 * @swagger
 * /api/alerts/stats:
 *   get:
 *     summary: Get alert statistics
 *     tags: [Alerts]
 *     responses:
 *       200:
 *         description: Alert statistics
 */
router.get('/stats', (_req, res) => {
  const stats = alertsService.getAlertStats();

  res.json({
    success: true,
    data: stats
  });
});

// Test endpoint to trigger demo alerts
router.post('/test-trigger', authenticateToken, (req: AuthRequest, res) => {
  const userId = req.user!.id;
  
  // Get current AAPL ticker
  const currentTicker = marketDataService.getTicker('AAPL');
  if (!currentTicker) {
    res.status(404).json({ success: false, error: 'AAPL ticker not found' });
    return;
  }

  // Create an alert slightly below current price to trigger immediately
  const alert = alertsService.createAlert(
    userId,
    'AAPL',
    'above',
    currentTicker.price - 0.01  // Set threshold just below current price to trigger
  );

  // Manually trigger the alert
  alertsService.checkAlerts(currentTicker);

  res.json({
    success: true,
    data: {
      alert,
      currentPrice: currentTicker.price,
      message: 'Test alert created and should trigger immediately'
    }
  });
});

export default router;