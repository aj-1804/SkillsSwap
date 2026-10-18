import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../config/database.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'skillswap_super_secret_jwt_key_2026_mca_project';

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  role: 'student' | 'admin';
  status: 'active' | 'suspended';
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export const signToken = (user: { id: number; email: string; name: string; role: string }): string => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

export const authenticateJwt = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ success: false, message: 'Authentication required. Missing token.' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    const user = await db.queryOne<AuthUser>(
      'SELECT id, name, email, role, status FROM users WHERE id = ?',
      [decoded.id]
    );

    if (!user) {
      res.status(401).json({ success: false, message: 'User not found or account deactivated.' });
      return;
    }

    if (user.status === 'suspended') {
      res.status(403).json({ success: false, message: 'Your account has been suspended by an administrator.' });
      return;
    }

    req.user = user;
    next();
  } catch (err: any) {
    res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};

export const requireAdmin = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ success: false, message: 'Access denied. Administrator privileges required.' });
    return;
  }
  next();
};

export const optionalAuth = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      const user = await db.queryOne<AuthUser>(
        'SELECT id, name, email, role, status FROM users WHERE id = ?',
        [decoded.id]
      );
      if (user && user.status === 'active') {
        req.user = user;
      }
    }
  } catch {
    // Ignore invalid optional tokens
  }
  next();
};
