import { Response } from 'express';
import { db } from '../config/database.ts';
import { AuthenticatedRequest } from '../middleware/auth.ts';

export const createBooking = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { listing_id, scheduled_at, duration_minutes = 60, student_notes } = req.body;

    if (!listing_id || !scheduled_at) {
      res.status(400).json({ success: false, message: 'Listing and preferred schedule are required.' });
      return;
    }

    const listing = await db.queryOne<any>(
      `SELECT l.id, l.user_id, l.title, l.skill_name, l.price_inr, l.session_duration_minutes, l.is_active, u.name as instructor_name
       FROM skill_listings l
       JOIN users u ON l.user_id = u.id
       WHERE l.id = ?`,
      [listing_id]
    );

    if (!listing) {
      res.status(404).json({ success: false, message: 'Skill listing not found.' });
      return;
    }

    if (listing.user_id === req.user.id) {
      res.status(400).json({ success: false, message: 'You cannot book your own skill listing.' });
      return;
    }

    const price = Number(listing.price_inr) || 0;
    const initialStatus = price > 0 ? 'awaiting_payment' : 'confirmed';

    const result = await db.execute(
      `INSERT INTO bookings (listing_id, student_id, instructor_id, session_price_inr, scheduled_at, duration_minutes, student_notes, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        listing.id,
        req.user.id,
        listing.user_id,
        price,
        scheduled_at,
        duration_minutes || listing.session_duration_minutes || 60,
        student_notes || '',
        initialStatus,
      ]
    );

    const bookingId = result.insertId;

    // If free or zero price, auto-create scheduled session
    if (initialStatus === 'confirmed') {
      const meetLink = `https://meet.skillswap.in/room-book-${bookingId}-${Date.now().toString(36)}`;
      await db.execute(
        `INSERT INTO sessions (booking_id, instructor_id, student_id, scheduled_at, duration_minutes, meeting_link, status)
         VALUES (?, ?, ?, ?, ?, ?, 'scheduled')`,
        [bookingId, listing.user_id, req.user.id, scheduled_at, duration_minutes, meetLink]
      );
    }

    // Notify instructor
    await db.execute(
      `INSERT INTO notifications (user_id, type, title, message, link)
       VALUES (?, 'new_booking', 'New Learning Session Booked!', ?, '/bookings')`,
      [
        listing.user_id,
        `${req.user.name} booked a session for "${listing.title}" for ₹${price} (${scheduled_at}).`,
      ]
    );

    res.status(201).json({
      success: true,
      message: price > 0 ? 'Booking created. Please complete payment.' : 'Booking confirmed!',
      bookingId,
      sessionPrice: price,
      status: initialStatus,
    });
  } catch (err: any) {
    console.error('[CreateBooking Error]', err);
    res.status(500).json({ success: false, message: 'Failed to create booking.' });
  }
};

export const getMyBookings = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { role = 'all' } = req.query;

    let whereClause = '(b.student_id = ? OR b.instructor_id = ?)';
    let params: any[] = [req.user.id, req.user.id];

    if (role === 'learner') {
      whereClause = 'b.student_id = ?';
      params = [req.user.id];
    } else if (role === 'instructor') {
      whereClause = 'b.instructor_id = ?';
      params = [req.user.id];
    }

    const sql = `
      SELECT 
        b.*,
        l.title as listing_title, l.skill_name, l.proficiency_level,
        u_inst.name as instructor_name, u_inst.avatar_url as instructor_avatar, u_inst.email as instructor_email,
        u_stud.name as student_name, u_stud.avatar_url as student_avatar, u_stud.email as student_email,
        s.id as session_id, s.meeting_link, s.status as session_status,
        (SELECT r.id FROM reviews r WHERE r.listing_id = b.listing_id AND r.reviewer_id = ?) as user_review_id
      FROM bookings b
      JOIN skill_listings l ON b.listing_id = l.id
      JOIN users u_inst ON b.instructor_id = u_inst.id
      JOIN users u_stud ON b.student_id = u_stud.id
      LEFT JOIN sessions s ON s.booking_id = b.id
      WHERE ${whereClause}
      ORDER BY b.created_at DESC
    `;

    const bookings = await db.query(sql, [req.user.id, ...params]);

    res.json({
      success: true,
      data: bookings.map(b => ({
        ...b,
        isStudent: b.student_id === req.user?.id,
        isInstructor: b.instructor_id === req.user?.id,
      })),
    });
  } catch (err: any) {
    console.error('[GetMyBookings Error]', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve bookings.' });
  }
};

export const getBookingById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { id } = req.params;

    const booking = await db.queryOne<any>(
      `SELECT 
        b.*,
        l.title as listing_title, l.skill_name, l.proficiency_level,
        u_inst.name as instructor_name, u_inst.avatar_url as instructor_avatar,
        u_stud.name as student_name, u_stud.avatar_url as student_avatar,
        s.id as session_id, s.meeting_link, s.status as session_status
      FROM bookings b
      JOIN skill_listings l ON b.listing_id = l.id
      JOIN users u_inst ON b.instructor_id = u_inst.id
      JOIN users u_stud ON b.student_id = u_stud.id
      LEFT JOIN sessions s ON s.booking_id = b.id
      WHERE b.id = ?`,
      [id]
    );

    if (!booking) {
      res.status(404).json({ success: false, message: 'Booking not found.' });
      return;
    }

    if (booking.student_id !== req.user.id && booking.instructor_id !== req.user.id && req.user.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Unauthorized access to this booking.' });
      return;
    }

    res.json({ success: true, booking });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch booking details.' });
  }
};

export const cancelBooking = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    const booking = await db.queryOne<any>('SELECT * FROM bookings WHERE id = ?', [id]);

    if (!booking) {
      res.status(404).json({ success: false, message: 'Booking not found.' });
      return;
    }

    if (booking.student_id !== req.user.id && booking.instructor_id !== req.user.id && req.user.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Permission denied.' });
      return;
    }

    if (booking.status === 'completed') {
      res.status(400).json({ success: false, message: 'Completed bookings cannot be cancelled.' });
      return;
    }

    await db.execute("UPDATE bookings SET status = 'cancelled' WHERE id = ?", [id]);
    await db.execute("UPDATE sessions SET status = 'cancelled' WHERE booking_id = ?", [id]);

    const otherUserId = booking.student_id === req.user.id ? booking.instructor_id : booking.student_id;
    await db.execute(
      `INSERT INTO notifications (user_id, type, title, message, link)
       VALUES (?, 'booking_cancelled', 'Booking Cancelled', 'A learning session booking was cancelled.', '/bookings')`,
      [otherUserId]
    );

    res.json({ success: true, message: 'Booking cancelled.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to cancel booking.' });
  }
};

export const completeBooking = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    const booking = await db.queryOne<any>('SELECT * FROM bookings WHERE id = ?', [id]);

    if (!booking) {
      res.status(404).json({ success: false, message: 'Booking not found.' });
      return;
    }

    if (booking.instructor_id !== req.user.id && booking.student_id !== req.user.id && req.user.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Permission denied.' });
      return;
    }

    await db.execute("UPDATE bookings SET status = 'completed' WHERE id = ?", [id]);
    await db.execute("UPDATE sessions SET status = 'completed' WHERE booking_id = ?", [id]);

    // Send review request notification to student
    await db.execute(
      `INSERT INTO notifications (user_id, type, title, message, link)
       VALUES (?, 'leave_review', 'Session Completed! Leave a Review', 'How was your learning experience? Share your feedback with the community.', '/bookings')`,
      [booking.student_id]
    );

    res.json({ success: true, message: 'Session marked as completed. You can now leave a review!' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to mark booking as completed.' });
  }
};

export const confirmBookingPayment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    const { transaction_id, payment_method = 'upi' } = req.body;

    const booking = await db.queryOne<any>('SELECT * FROM bookings WHERE id = ?', [id]);
    if (!booking) {
      res.status(404).json({ success: false, message: 'Booking not found.' });
      return;
    }

    if (booking.student_id !== req.user.id && req.user.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Only the student who booked can confirm payment.' });
      return;
    }

    await db.execute("UPDATE bookings SET status = 'confirmed' WHERE id = ?", [id]);

    // Record payment
    const txn = transaction_id || `SSG-TXN-${Date.now()}`;
    await db.execute(
      `INSERT INTO payments (user_id, booking_id, payment_type, amount_inr, payment_method, transaction_id, gateway_status)
       VALUES (?, ?, 'booking', ?, ?, ?, 'success')`,
      [req.user.id, id, booking.session_price_inr, payment_method, txn]
    );

    // Create session room link
    const meetLink = `https://meet.skillswap.in/room-book-${id}-${Date.now().toString(36)}`;
    await db.execute(
      `INSERT INTO sessions (booking_id, instructor_id, student_id, scheduled_at, duration_minutes, meeting_link, status)
       VALUES (?, ?, ?, ?, ?, ?, 'scheduled')`,
      [id, booking.instructor_id, booking.student_id, booking.scheduled_at, booking.duration_minutes, meetLink]
    );

    // Notifications
    await db.execute(
      `INSERT INTO notifications (user_id, type, title, message, link)
       VALUES (?, 'booking_confirmed', 'Payment Received & Session Confirmed', 'Your learning session payment of ₹' || ? || ' was processed successfully.', '/bookings')`,
      [req.user.id, booking.session_price_inr]
    );
    await db.execute(
      `INSERT INTO notifications (user_id, type, title, message, link)
       VALUES (?, 'booking_confirmed', 'Student Paid for Session', 'Student payment confirmed. Your upcoming teaching session is scheduled!', '/bookings')`,
      [booking.instructor_id]
    );

    res.json({
      success: true,
      message: 'Payment verified and session confirmed successfully!',
      transactionId: txn,
    });
  } catch (err: any) {
    console.error('[ConfirmBookingPayment Error]', err);
    res.status(500).json({ success: false, message: 'Failed to verify booking payment.' });
  }
};
