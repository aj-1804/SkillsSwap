import { Request, Response } from 'express';
import { db } from '../config/database.ts';
import { AuthenticatedRequest } from '../middleware/auth.ts';

export const getRewards = async (_req: Request, res: Response): Promise<void> => {
  try {
    const items = await db.query(
      'SELECT * FROM reward_items WHERE is_active = 1 ORDER BY category ASC, points_cost ASC'
    );
    res.json({ success: true, items });
  } catch (err: any) {
    console.error('[GetRewards Error]', err);
    res.status(500).json({ success: false, message: 'Failed to load rewards store catalog' });
  }
};

export const getMyWallet = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const user = await db.queryOne<any>(
      'SELECT id, name, email, points, subscription_tier, subscription_expires_at FROM users WHERE id = ?',
      [req.user.id]
    );

    const transactions = await db.query(
      'SELECT * FROM point_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 30',
      [req.user.id]
    );

    // Calculate total earned points
    const earnedSummary = await db.queryOne<any>(
      'SELECT SUM(amount) as total_earned FROM point_transactions WHERE user_id = ? AND amount > 0',
      [req.user.id]
    );

    // Calculate total spent points
    const spentSummary = await db.queryOne<any>(
      'SELECT SUM(ABS(amount)) as total_spent FROM point_transactions WHERE user_id = ? AND amount < 0',
      [req.user.id]
    );

    res.json({
      success: true,
      wallet: {
        currentPoints: user?.points || 0,
        totalEarned: Number(earnedSummary?.total_earned || user?.points || 0),
        totalSpent: Number(spentSummary?.total_spent || 0),
        subscriptionTier: user?.subscription_tier || 'free',
        subscriptionExpiresAt: user?.subscription_expires_at || null,
        transactions,
      },
    });
  } catch (err: any) {
    console.error('[GetMyWallet Error]', err);
    res.status(500).json({ success: false, message: 'Failed to fetch wallet info' });
  }
};

export const redeemReward = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const itemId = parseInt(req.params.id, 10);
    const { shipping_address } = req.body;

    const item = await db.queryOne<any>('SELECT * FROM reward_items WHERE id = ? AND is_active = 1', [itemId]);
    if (!item) {
      res.status(404).json({ success: false, message: 'Reward item not found or unavailable' });
      return;
    }

    const user = await db.queryOne<any>(
      'SELECT id, name, email, points, subscription_tier, subscription_expires_at FROM users WHERE id = ?',
      [req.user.id]
    );

    const currentPoints = user?.points || 0;
    if (currentPoints < item.points_cost) {
      res.status(400).json({
        success: false,
        message: `Insufficient points balance. You need ${item.points_cost} points, but have ${currentPoints} points. Earn more by taking quizzes and participating in contests!`,
        needed: item.points_cost - currentPoints,
      });
      return;
    }

    // Generate unique claim code
    const prefix = item.category === 'subscription' ? 'SUB' : item.category === 'gift' ? 'GIFT' : 'VOUCH';
    const randomHex = Math.random().toString(36).substring(2, 7).toUpperCase();
    const claimCode = `SWAP-${prefix}-${randomHex}`;

    // Deduct points
    const newBalance = currentPoints - item.points_cost;
    await db.execute('UPDATE users SET points = ? WHERE id = ?', [newBalance, req.user.id]);

    // Handle Subscription upgrade if applicable
    let expiresAt: string | null = null;
    if (item.category === 'subscription' && item.tier_code) {
      const days = item.duration_days || 30;
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + days);
      expiresAt = targetDate.toISOString();

      await db.execute(
        'UPDATE users SET subscription_tier = ?, subscription_expires_at = ? WHERE id = ?',
        [item.tier_code, expiresAt, req.user.id]
      );

      await db.execute(
        `INSERT INTO notifications (user_id, type, title, message, link)
         VALUES (?, 'subscription_activated', 'Subscription Upgraded!', ?, ?)`,
        [
          req.user.id,
          `Congratulations! Your ${item.title} is now active until ${targetDate.toLocaleDateString('en-IN')}. Enjoy 0% commission & VIP privileges!`,
          '/rewards',
        ]
      );
    } else {
      // Physical gift or voucher notification
      await db.execute(
        `INSERT INTO notifications (user_id, type, title, message, link)
         VALUES (?, 'reward_redeemed', 'Reward Claimed!', ?, ?)`,
        [
          req.user.id,
          `You successfully redeemed "${item.title}"! Claim code: ${claimCode}.`,
          '/rewards',
        ]
      );
    }

    // Record point transaction
    await db.execute(
      `INSERT INTO point_transactions (user_id, amount, transaction_type, description, reference_id)
       VALUES (?, ?, 'reward_redeemed', ?, ?)`,
      [req.user.id, -item.points_cost, `Redeemed ${item.title}`, claimCode]
    );

    // Record redemption
    const redemptionResult = await db.execute(
      `INSERT INTO reward_redemptions 
       (user_id, reward_item_id, points_spent, claim_code, shipping_address, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        item.id,
        item.points_cost,
        claimCode,
        shipping_address || (item.category === 'gift' ? 'Default student address' : null),
        item.category === 'subscription' ? 'active' : item.category === 'gift' ? 'processing_shipment' : 'delivered',
      ]
    );

    res.status(201).json({
      success: true,
      message: `Successfully redeemed ${item.title}!`,
      redemptionId: redemptionResult.insertId,
      claimCode,
      newPointsBalance: newBalance,
      subscriptionTier: item.tier_code || user.subscription_tier,
      expiresAt,
    });
  } catch (err: any) {
    console.error('[RedeemReward Error]', err);
    res.status(500).json({ success: false, message: 'Failed to redeem reward' });
  }
};

export const getMyRedemptions = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const redemptions = await db.query(
      `SELECT r.*, ri.title, ri.category, ri.image_url, ri.badge, ri.original_price_inr
       FROM reward_redemptions r
       JOIN reward_items ri ON r.reward_item_id = ri.id
       WHERE r.user_id = ?
       ORDER BY r.created_at DESC`,
      [req.user.id]
    );

    res.json({ success: true, redemptions });
  } catch (err: any) {
    console.error('[GetMyRedemptions Error]', err);
    res.status(500).json({ success: false, message: 'Failed to fetch redemption history' });
  }
};
