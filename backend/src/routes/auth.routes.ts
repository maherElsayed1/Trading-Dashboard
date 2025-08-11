import { Router } from 'express';
import { generateToken, authenticateToken, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

// Mock user database
const mockUsers = [
  { id: '1', email: 'admin@trading.com', password: 'admin123', name: 'Admin User' },
  { id: '2', email: 'trader@trading.com', password: 'trader123', name: 'Trader Joe' },
  { id: '3', email: 'demo@trading.com', password: 'demo123', name: 'Demo User' }
];

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: demo@trading.com
 *               password:
 *                 type: string
 *                 example: demo123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         email:
 *                           type: string
 *                         name:
 *                           type: string
 */
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({
      success: false,
      error: 'Email and password are required'
    });
    return;
  }

  // Mock authentication
  const user = mockUsers.find(u => u.email === email && u.password === password);

  if (!user) {
    res.status(401).json({
      success: false,
      error: 'Invalid email or password'
    });
    return;
  }

  const token = generateToken({ id: user.id, email: user.email, name: user.name });

  res.json({
    success: true,
    data: {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    }
  });
});

/**
 * @swagger
 * /api/auth/verify:
 *   get:
 *     summary: Verify authentication token
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token is valid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 */
router.get('/verify', authenticateToken, (req: AuthRequest, res) => {
  res.json({
    success: true,
    data: {
      user: req.user
    }
  });
});

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 */
router.post('/logout', authenticateToken, (_req, res) => {
  // In a real application, you might want to blacklist the token
  // For now, just return success
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

export default router;