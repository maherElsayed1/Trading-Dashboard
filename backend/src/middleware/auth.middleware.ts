import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';

// Mock JWT secret - in production, use environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'mock-secret-key-for-development';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
  };
}

export const generateToken = (user: { id: string; email: string; name: string }) => {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};

export const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, JWT_SECRET) as { id: string; email: string; name: string };
  } catch (error) {
    return null;
  }
};

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({ success: false, error: 'Access token required' });
    return;
  }

  const user = verifyToken(token);
  if (!user) {
    res.status(403).json({ success: false, error: 'Invalid or expired token' });
    return;
  }

  req.user = user;
  next();
};

// Optional authentication - doesn't block if no token
export const optionalAuth = (req: AuthRequest, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    const user = verifyToken(token);
    if (user) {
      req.user = user;
    }
  }

  next();
};