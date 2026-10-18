import { Response } from 'express';
import { db } from '../config/database.ts';
import { AuthenticatedRequest } from '../middleware/auth.ts';

export const createReview = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { listing_id, session_id, rating, comment } = req.body;

    if (!listing_id || !rating || !comment) {
      res.status(400).json({ success: false, message: 'Listing, rating (1-5), and feedback comment are required.' });
      return;
    }

    const numRating = Math.min(5, Math.max(1, parseInt(rating, 10)));

    const listing = await db.queryOne<any>('SELECT user_id FROM skill_listings WHERE id = ?', [listing_id]);
    if (!listing) {
      res.status(404).json({ success: false, message: 'Skill listing not found.' });
      return;
    }

    if (listing.user_id === req.user.id) {
      res.status(400).json({ success: false, message: 'You cannot review your own listing.' });
      return;
    }

    // Check duplicate review
    const existing = await db.queryOne<any>(
      'SELECT id FROM reviews WHERE listing_id = ? AND reviewer_id = ?',
      [listing_id, req.user.id]
    );

    if (existing) {
      res.status(400).json({ success: false, message: 'You have already submitted a review for this skill.' });
      return;
    }

    const result = await db.execute(
      `INSERT INTO reviews (session_id, listing_id, reviewer_id, reviewee_id, rating, comment)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [session_id || null, listing_id, req.user.id, listing.user_id, numRating, comment.trim()]
    );

    // Recalculate listing average rating and total reviews
    const stats = await db.queryOne<any>(
      'SELECT AVG(rating) as avg_rating, COUNT(*) as total FROM reviews WHERE listing_id = ?',
      [listing_id]
    );

    const newAvg = stats ? Math.round(Number(stats.avg_rating) * 100) / 100 : numRating;
    const newTotal = stats ? Number(stats.total) : 1;

    await db.execute(
      'UPDATE skill_listings SET rating_avg = ?, total_reviews = ? WHERE id = ?',
      [newAvg, newTotal, listing_id]
    );

    // Notify instructor
    await db.execute(
      `INSERT INTO notifications (user_id, type, title, message, link)
       VALUES (?, 'new_review', 'New Student Review Received', ?, '/explore')`,
      [listing.user_id, `${req.user.name} rated your skill ${numRating} stars: "${comment.slice(0, 60)}..."`]
    );

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully. Thank you for your feedback!',
      reviewId: result.insertId,
    });
  } catch (err: any) {
    console.error('[CreateReview Error]', err);
    res.status(500).json({ success: false, message: 'Failed to submit review.' });
  }
};
