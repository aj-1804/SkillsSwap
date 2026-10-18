import { Response } from 'express';
import { db } from '../config/database.ts';
import { AuthenticatedRequest } from '../middleware/auth.ts';

export const createReport = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { reported_user_id, listing_id, reason } = req.body;

    if (!reason || !reason.trim()) {
      res.status(400).json({ success: false, message: 'Please specify the reason for your report.' });
      return;
    }

    const result = await db.execute(
      `INSERT INTO reports (reporter_id, reported_user_id, listing_id, reason, status)
       VALUES (?, ?, ?, ?, 'pending')`,
      [req.user.id, reported_user_id || null, listing_id || null, reason.trim()]
    );

    res.status(201).json({
      success: true,
      message: 'Report submitted. Our moderation team will review this shortly.',
      reportId: result.insertId,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to submit report.' });
  }
};
