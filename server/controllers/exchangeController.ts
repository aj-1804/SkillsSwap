import { Response } from 'express';
import { db } from '../config/database.ts';
import { AuthenticatedRequest } from '../middleware/auth.ts';

/**
 * Core Skill Exchange Business Logic
 * Rule 1: Equal-level / Equal-value exchange => Free (diff = 0)
 * Rule 2: Unequal-value exchange => Additional Payment = max(0, Higher - Lower)
 */
export const calculateExchangeDifference = (
  priceA: number,
  priceB: number,
  userAId: number,
  userBId: number
) => {
  const pA = Math.max(0, Number(priceA) || 0);
  const pB = Math.max(0, Number(priceB) || 0);

  if (pA === pB) {
    return {
      additionalPayment: 0,
      payerUserId: null,
      isEqual: true,
      priceDifference: 0,
    };
  }

  const diff = Math.abs(pA - pB);
  // If user B's skill is valued higher, user A must pay the difference
  // If user A's skill is valued higher, user B must pay the difference
  const payerUserId = pB > pA ? userAId : userBId;

  return {
    additionalPayment: diff,
    payerUserId,
    isEqual: false,
    priceDifference: diff,
  };
};

export const createExchangeRequest = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const {
      recipient_id,
      initiator_listing_id,
      recipient_listing_id,
      proposed_date,
      notes,
    } = req.body;

    if (!recipient_id || !initiator_listing_id || !recipient_listing_id) {
      res.status(400).json({ success: false, message: 'Please provide recipient and listings for both sides of the exchange.' });
      return;
    }

    if (Number(recipient_id) === req.user.id) {
      res.status(400).json({ success: false, message: 'You cannot propose a skill swap with yourself.' });
      return;
    }

    // Verify initiator listing belongs to current user
    const initiatorListing = await db.queryOne<any>(
      'SELECT id, user_id, skill_name, proficiency_level, price_inr, is_active FROM skill_listings WHERE id = ?',
      [initiator_listing_id]
    );

    if (!initiatorListing || initiatorListing.user_id !== req.user.id) {
      res.status(400).json({ success: false, message: 'Your offered skill listing was not found or is invalid.' });
      return;
    }

    // Verify recipient listing
    const recipientListing = await db.queryOne<any>(
      'SELECT id, user_id, skill_name, proficiency_level, price_inr, is_active FROM skill_listings WHERE id = ?',
      [recipient_listing_id]
    );

    if (!recipientListing || recipientListing.user_id !== Number(recipient_id)) {
      res.status(400).json({ success: false, message: 'Requested skill listing was not found or does not belong to the recipient.' });
      return;
    }

    // Calculate official backend fee calculation (never rely on frontend math)
    const calculation = calculateExchangeDifference(
      initiatorListing.price_inr,
      recipientListing.price_inr,
      req.user.id,
      Number(recipient_id)
    );

    const result = await db.execute(
      `INSERT INTO exchange_requests 
        (initiator_id, recipient_id, initiator_listing_id, recipient_listing_id, 
         initiator_session_price, recipient_session_price, additional_payment_amount, 
         payer_user_id, proposed_date, notes, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        req.user.id,
        Number(recipient_id),
        initiatorListing.id,
        recipientListing.id,
        initiatorListing.price_inr,
        recipientListing.price_inr,
        calculation.additionalPayment,
        calculation.payerUserId,
        proposed_date || 'Flexible',
        notes || '',
      ]
    );

    const exchangeId = result.insertId;

    // Record exchange skills
    await db.execute(
      `INSERT INTO exchange_request_skills (exchange_id, skill_name, proficiency_level, role_type)
       VALUES (?, ?, ?, 'initiator_offer')`,
      [exchangeId, initiatorListing.skill_name, initiatorListing.proficiency_level]
    );
    await db.execute(
      `INSERT INTO exchange_request_skills (exchange_id, skill_name, proficiency_level, role_type)
       VALUES (?, ?, ?, 'recipient_offer')`,
      [exchangeId, recipientListing.skill_name, recipientListing.proficiency_level]
    );

    // Notify recipient
    await db.execute(
      `INSERT INTO notifications (user_id, type, title, message, link)
       VALUES (?, 'exchange_request', 'New Skill Exchange Proposal', ?, '/exchanges')`,
      [
        Number(recipient_id),
        `${req.user.name} proposed to swap "${initiatorListing.skill_name}" (${initiatorListing.proficiency_level}) for your "${recipientListing.skill_name}". ${
          calculation.additionalPayment > 0
            ? `Difference of ₹${calculation.additionalPayment} applies.`
            : 'Equal-level free exchange!'
        }`,
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Skill exchange request submitted successfully.',
      exchangeId,
      calculation,
    });
  } catch (err: any) {
    console.error('[CreateExchange Error]', err);
    res.status(500).json({ success: false, message: 'Failed to create skill exchange request.' });
  }
};

export const getMyExchanges = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { type = 'all' } = req.query;

    let filterClause = '(e.initiator_id = ? OR e.recipient_id = ?)';
    let params: any[] = [req.user.id, req.user.id];

    if (type === 'incoming') {
      filterClause = 'e.recipient_id = ?';
      params = [req.user.id];
    } else if (type === 'outgoing') {
      filterClause = 'e.initiator_id = ?';
      params = [req.user.id];
    }

    const sql = `
      SELECT 
        e.*,
        u_init.name as initiator_name, u_init.avatar_url as initiator_avatar, u_init.email as initiator_email,
        u_recip.name as recipient_name, u_recip.avatar_url as recipient_avatar, u_recip.email as recipient_email,
        l_init.title as initiator_listing_title, l_init.skill_name as initiator_skill_name, l_init.proficiency_level as initiator_proficiency,
        l_recip.title as recipient_listing_title, l_recip.skill_name as recipient_skill_name, l_recip.proficiency_level as recipient_proficiency
      FROM exchange_requests e
      JOIN users u_init ON e.initiator_id = u_init.id
      JOIN users u_recip ON e.recipient_id = u_recip.id
      JOIN skill_listings l_init ON e.initiator_listing_id = l_init.id
      JOIN skill_listings l_recip ON e.recipient_listing_id = l_recip.id
      WHERE ${filterClause}
      ORDER BY e.created_at DESC
    `;

    const exchanges = await db.query(sql, params);

    res.json({
      success: true,
      data: exchanges.map(ex => ({
        ...ex,
        isIncoming: ex.recipient_id === req.user?.id,
        isInitiator: ex.initiator_id === req.user?.id,
        isPayer: ex.payer_user_id === req.user?.id,
      })),
    });
  } catch (err: any) {
    console.error('[GetMyExchanges Error]', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve exchange requests.' });
  }
};

export const getExchangeById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { id } = req.params;

    const exchange = await db.queryOne<any>(
      `SELECT 
        e.*,
        u_init.name as initiator_name, u_init.avatar_url as initiator_avatar, u_init.location as initiator_location,
        u_recip.name as recipient_name, u_recip.avatar_url as recipient_avatar, u_recip.location as recipient_location,
        l_init.title as initiator_listing_title, l_init.skill_name as initiator_skill_name, l_init.proficiency_level as initiator_proficiency,
        l_recip.title as recipient_listing_title, l_recip.skill_name as recipient_skill_name, l_recip.proficiency_level as recipient_proficiency
      FROM exchange_requests e
      JOIN users u_init ON e.initiator_id = u_init.id
      JOIN users u_recip ON e.recipient_id = u_recip.id
      JOIN skill_listings l_init ON e.initiator_listing_id = l_init.id
      JOIN skill_listings l_recip ON e.recipient_listing_id = l_recip.id
      WHERE e.id = ?`,
      [id]
    );

    if (!exchange) {
      res.status(404).json({ success: false, message: 'Exchange request not found.' });
      return;
    }

    // Permission check
    if (exchange.initiator_id !== req.user.id && exchange.recipient_id !== req.user.id && req.user.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Unauthorized to view this exchange request.' });
      return;
    }

    res.json({ success: true, exchange });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch exchange request.' });
  }
};

export const acceptExchange = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    const exchange = await db.queryOne<any>('SELECT * FROM exchange_requests WHERE id = ?', [id]);

    if (!exchange) {
      res.status(404).json({ success: false, message: 'Exchange request not found.' });
      return;
    }

    if (exchange.recipient_id !== req.user.id && req.user.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Only the recipient of this proposal can accept it.' });
      return;
    }

    if (exchange.status !== 'pending') {
      res.status(400).json({ success: false, message: `Cannot accept exchange with status: ${exchange.status}` });
      return;
    }

    // If additional_payment_amount > 0, status moves to 'awaiting_payment'
    // If equal level (payment = 0), status moves straight to 'confirmed' and sessions are created
    let newStatus = 'accepted';
    if (Number(exchange.additional_payment_amount) > 0) {
      newStatus = 'awaiting_payment';
    } else {
      newStatus = 'confirmed';
    }

    await db.execute('UPDATE exchange_requests SET status = ? WHERE id = ?', [newStatus, id]);

    // If confirmed (free equal swap), auto-schedule session
    if (newStatus === 'confirmed') {
      const meetLink = `https://meet.skillswap.in/room-swap-${exchange.id}-${Date.now().toString(36)}`;
      await db.execute(
        `INSERT INTO sessions (exchange_id, instructor_id, student_id, scheduled_at, duration_minutes, meeting_link, status)
         VALUES (?, ?, ?, ?, 60, ?, 'scheduled')`,
        [exchange.id, exchange.initiator_id, exchange.recipient_id, exchange.proposed_date || 'Upcoming Weekend', meetLink]
      );
    }

    // Notify initiator
    const msg =
      newStatus === 'confirmed'
        ? 'Your equal-value skill exchange was accepted and is now confirmed! Meeting room created.'
        : `Your exchange was accepted! A differential payment of ₹${exchange.additional_payment_amount} is awaiting payment.`;

    await db.execute(
      `INSERT INTO notifications (user_id, type, title, message, link)
       VALUES (?, 'exchange_accepted', 'Skill Exchange Accepted!', ?, '/exchanges')`,
      [exchange.initiator_id, msg]
    );

    res.json({
      success: true,
      message: `Skill exchange request accepted. Status: ${newStatus}`,
      status: newStatus,
    });
  } catch (err: any) {
    console.error('[AcceptExchange Error]', err);
    res.status(500).json({ success: false, message: 'Failed to accept exchange request.' });
  }
};

export const rejectExchange = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    const { reason } = req.body;

    const exchange = await db.queryOne<any>('SELECT * FROM exchange_requests WHERE id = ?', [id]);
    if (!exchange) {
      res.status(404).json({ success: false, message: 'Exchange request not found.' });
      return;
    }

    if (exchange.recipient_id !== req.user.id && req.user.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Only the recipient or an admin can reject this proposal.' });
      return;
    }

    await db.execute("UPDATE exchange_requests SET status = 'rejected' WHERE id = ?", [id]);

    await db.execute(
      `INSERT INTO notifications (user_id, type, title, message, link)
       VALUES (?, 'exchange_rejected', 'Skill Exchange Declined', ?, '/exchanges')`,
      [exchange.initiator_id, `Your skill exchange proposal was declined.${reason ? ` Reason: ${reason}` : ''}`]
    );

    res.json({ success: true, message: 'Skill exchange request rejected.' });
  } catch (err: any) {
    console.error('[RejectExchange Error]', err);
    res.status(500).json({ success: false, message: 'Failed to reject exchange request.' });
  }
};

export const confirmExchangeAfterPayment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    const { transaction_id } = req.body;

    const exchange = await db.queryOne<any>('SELECT * FROM exchange_requests WHERE id = ?', [id]);
    if (!exchange) {
      res.status(404).json({ success: false, message: 'Exchange request not found.' });
      return;
    }

    // Verify payer or admin
    if (exchange.payer_user_id && exchange.payer_user_id !== req.user.id && req.user.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Only the designated paying party can confirm payment.' });
      return;
    }

    // Update status to confirmed
    await db.execute("UPDATE exchange_requests SET status = 'confirmed' WHERE id = ?", [id]);

    // Create session room
    const meetLink = `https://meet.skillswap.in/room-swap-${exchange.id}-${Date.now().toString(36)}`;
    await db.execute(
      `INSERT INTO sessions (exchange_id, instructor_id, student_id, scheduled_at, duration_minutes, meeting_link, status)
       VALUES (?, ?, ?, ?, 60, ?, 'scheduled')`,
      [exchange.id, exchange.initiator_id, exchange.recipient_id, exchange.proposed_date || 'Upcoming Weekend', meetLink]
    );

    // Record payment if transaction ID provided
    if (transaction_id && Number(exchange.additional_payment_amount) > 0) {
      await db.execute(
        `INSERT INTO payments (user_id, exchange_id, payment_type, amount_inr, payment_method, transaction_id, gateway_status)
         VALUES (?, ?, 'exchange_difference', ?, 'demo_gateway', ?, 'success')`,
        [req.user.id, exchange.id, exchange.additional_payment_amount, transaction_id]
      );
    }

    // Notify both parties
    await db.execute(
      `INSERT INTO notifications (user_id, type, title, message, link)
       VALUES (?, 'exchange_confirmed', 'Exchange Confirmed & Ready!', 'Differential fee was paid and your exchange session is now active!', '/exchanges')`,
      [exchange.initiator_id]
    );
    await db.execute(
      `INSERT INTO notifications (user_id, type, title, message, link)
       VALUES (?, 'exchange_confirmed', 'Exchange Confirmed & Ready!', 'Payment received and your exchange session is now confirmed!', '/exchanges')`,
      [exchange.recipient_id]
    );

    res.json({
      success: true,
      message: 'Exchange confirmed successfully! Learning session generated.',
      status: 'confirmed',
    });
  } catch (err: any) {
    console.error('[ConfirmExchange Error]', err);
    res.status(500).json({ success: false, message: 'Failed to confirm exchange.' });
  }
};
