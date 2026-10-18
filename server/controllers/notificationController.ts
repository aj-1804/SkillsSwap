import { Response } from 'express';
import { db } from '../config/database.ts';
import { AuthenticatedRequest } from '../middleware/auth.ts';

export const getNotifications = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const notifications = await db.query(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 30',
      [req.user.id]
    );

    const unreadCount = await db.queryOne<any>(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0',
      [req.user.id]
    );

    res.json({
      success: true,
      data: notifications,
      unreadCount: Number(unreadCount?.count || 0),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to retrieve notifications.' });
  }
};

export const markNotificationsRead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    await db.execute('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [req.user.id]);
    res.json({ success: true, message: 'Notifications marked as read.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to update notifications.' });
  }
};
