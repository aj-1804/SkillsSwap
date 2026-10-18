import { Response } from 'express';
import { db } from '../config/database.ts';
import { AuthenticatedRequest } from '../middleware/auth.ts';

export const createPaymentIntent = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { type, reference_id } = req.body; // type: 'booking' | 'exchange'
    if (!type || !reference_id) {
      res.status(400).json({ success: false, message: 'Payment type and reference ID are required.' });
      return;
    }

    let amount = 0;
    let description = '';

    if (type === 'booking') {
      const booking = await db.queryOne<any>('SELECT * FROM bookings WHERE id = ?', [reference_id]);
      if (!booking) {
        res.status(404).json({ success: false, message: 'Booking not found.' });
        return;
      }
      if (booking.student_id !== req.user.id) {
        res.status(403).json({ success: false, message: 'Unauthorized' });
        return;
      }
      amount = Number(booking.session_price_inr);
      description = `Direct learning session booking #${booking.id}`;
    } else if (type === 'exchange') {
      const exchange = await db.queryOne<any>('SELECT * FROM exchange_requests WHERE id = ?', [reference_id]);
      if (!exchange) {
        res.status(404).json({ success: false, message: 'Exchange request not found.' });
        return;
      }
      if (exchange.payer_user_id !== req.user.id) {
        res.status(403).json({ success: false, message: 'You are not the designated payer for this exchange.' });
        return;
      }
      amount = Number(exchange.additional_payment_amount);
      description = `SkillSwap differential fee for exchange #${exchange.id}`;
    } else {
      res.status(400).json({ success: false, message: 'Invalid payment type.' });
      return;
    }

    const orderId = `SSG-ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    res.json({
      success: true,
      order: {
        orderId,
        amountInr: amount,
        currency: 'INR',
        description,
        type,
        referenceId: reference_id,
        user: {
          name: req.user.name,
          email: req.user.email,
        },
      },
    });
  } catch (err: any) {
    console.error('[CreatePaymentIntent Error]', err);
    res.status(500).json({ success: false, message: 'Failed to create payment intent.' });
  }
};

export const verifyPayment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { type, reference_id, payment_method = 'upi', simulate_failure } = req.body;

    if (simulate_failure) {
      res.status(400).json({
        success: false,
        message: 'Payment simulated failure: Insufficient funds or bank authorization declined.',
        status: 'failed',
      });
      return;
    }

    const txnId = `SSG-TXN-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    if (type === 'booking') {
      const booking = await db.queryOne<any>('SELECT * FROM bookings WHERE id = ?', [reference_id]);
      if (!booking) {
        res.status(404).json({ success: false, message: 'Booking not found.' });
        return;
      }

      await db.execute("UPDATE bookings SET status = 'confirmed' WHERE id = ?", [booking.id]);

      // Create session
      const meetLink = `https://meet.skillswap.in/room-book-${booking.id}-${Date.now().toString(36)}`;
      await db.execute(
        `INSERT INTO sessions (booking_id, instructor_id, student_id, scheduled_at, duration_minutes, meeting_link, status)
         VALUES (?, ?, ?, ?, ?, ?, 'scheduled')`,
        [booking.id, booking.instructor_id, booking.student_id, booking.scheduled_at, booking.duration_minutes, meetLink]
      );

      // Record payment
      await db.execute(
        `INSERT INTO payments (user_id, booking_id, payment_type, amount_inr, payment_method, transaction_id, gateway_status)
         VALUES (?, ?, 'booking', ?, ?, ?, 'success')`,
        [req.user.id, booking.id, booking.session_price_inr, payment_method, txnId]
      );

      res.json({
        success: true,
        message: 'Payment verified successfully! Learning session confirmed.',
        transactionId: txnId,
        amountInr: booking.session_price_inr,
      });
      return;
    } else if (type === 'exchange') {
      const exchange = await db.queryOne<any>('SELECT * FROM exchange_requests WHERE id = ?', [reference_id]);
      if (!exchange) {
        res.status(404).json({ success: false, message: 'Exchange not found.' });
        return;
      }

      await db.execute("UPDATE exchange_requests SET status = 'confirmed' WHERE id = ?", [exchange.id]);

      // Create session
      const meetLink = `https://meet.skillswap.in/room-swap-${exchange.id}-${Date.now().toString(36)}`;
      await db.execute(
        `INSERT INTO sessions (exchange_id, instructor_id, student_id, scheduled_at, duration_minutes, meeting_link, status)
         VALUES (?, ?, ?, ?, 60, ?, 'scheduled')`,
        [exchange.id, exchange.initiator_id, exchange.recipient_id, exchange.proposed_date || 'Upcoming Weekend', meetLink]
      );

      // Record payment
      await db.execute(
        `INSERT INTO payments (user_id, exchange_id, payment_type, amount_inr, payment_method, transaction_id, gateway_status)
         VALUES (?, ?, 'exchange_difference', ?, ?, ?, 'success')`,
        [req.user.id, exchange.id, exchange.additional_payment_amount, payment_method, txnId]
      );

      res.json({
        success: true,
        message: 'Differential payment verified! Exchange session confirmed.',
        transactionId: txnId,
        amountInr: exchange.additional_payment_amount,
      });
      return;
    }

    res.status(400).json({ success: false, message: 'Invalid payment type' });
  } catch (err: any) {
    console.error('[VerifyPayment Error]', err);
    res.status(500).json({ success: false, message: 'Failed to verify payment.' });
  }
};

export const getMyPayments = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const payments = await db.query(
      `SELECT p.*, 
        b.session_price_inr, b.scheduled_at as booking_scheduled_at,
        e.additional_payment_amount as exchange_diff_amount
       FROM payments p
       LEFT JOIN bookings b ON p.booking_id = b.id
       LEFT JOIN exchange_requests e ON p.exchange_id = e.id
       WHERE p.user_id = ?
       ORDER BY p.created_at DESC`,
      [req.user.id]
    );

    res.json({ success: true, data: payments });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to retrieve payment records.' });
  }
};
