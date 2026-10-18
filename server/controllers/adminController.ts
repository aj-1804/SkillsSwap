import { Response } from 'express';
import { db } from '../config/database.ts';
import { AuthenticatedRequest } from '../middleware/auth.ts';

export const getAdminStats = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const totalUsers = await db.queryOne<any>("SELECT COUNT(*) as count FROM users WHERE role = 'student'");
    const totalListings = await db.queryOne<any>('SELECT COUNT(*) as count FROM skill_listings WHERE is_active = 1');
    const totalExchanges = await db.queryOne<any>("SELECT COUNT(*) as count FROM exchange_requests WHERE status IN ('confirmed', 'completed')");
    const totalBookings = await db.queryOne<any>("SELECT COUNT(*) as count FROM bookings WHERE status IN ('confirmed', 'completed')");
    const revenueRes = await db.queryOne<any>("SELECT SUM(amount_inr) as sum FROM payments WHERE gateway_status = 'success'");
    const pendingReports = await db.queryOne<any>("SELECT COUNT(*) as count FROM reports WHERE status = 'pending'");

    // Recent activity feed
    const recentPayments = await db.query(
      `SELECT p.*, u.name as user_name, u.email as user_email
       FROM payments p
       JOIN users u ON p.user_id = u.id
       ORDER BY p.created_at DESC LIMIT 6`
    );

    const recentUsers = await db.query(
      `SELECT id, name, email, role, location, status, created_at
       FROM users
       ORDER BY created_at DESC LIMIT 6`
    );

    res.json({
      success: true,
      stats: {
        totalStudents: Number(totalUsers?.count || 0),
        activeListings: Number(totalListings?.count || 0),
        completedExchanges: Number(totalExchanges?.count || 0),
        totalBookings: Number(totalBookings?.count || 0),
        totalRevenueInr: Number(revenueRes?.sum || 0),
        pendingReportsCount: Number(pendingReports?.count || 0),
      },
      recentPayments,
      recentUsers,
    });
  } catch (err: any) {
    console.error('[AdminStats Error]', err);
    res.status(500).json({ success: false, message: 'Failed to compile admin metrics.' });
  }
};

export const getAdminUsers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { search, status, role } = req.query;

    let where: string[] = [];
    let params: any[] = [];

    if (search) {
      where.push('(name LIKE ? OR email LIKE ? OR location LIKE ?)');
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    if (status) {
      where.push('status = ?');
      params.push(status);
    }

    if (role) {
      where.push('role = ?');
      params.push(role);
    }

    const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

    const users = await db.query(
      `SELECT id, name, email, role, avatar_url, location, languages, status, created_at,
        (SELECT COUNT(*) FROM skill_listings WHERE user_id = users.id) as listing_count,
        (SELECT COUNT(*) FROM exchange_requests WHERE initiator_id = users.id OR recipient_id = users.id) as exchange_count,
        (SELECT COUNT(*) FROM bookings WHERE student_id = users.id OR instructor_id = users.id) as booking_count
       FROM users
       ${whereSql}
       ORDER BY id ASC`,
      params
    );

    res.json({ success: true, data: users });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to retrieve users.' });
  }
};

export const toggleUserStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'active' | 'suspended'

    if (!['active', 'suspended'].includes(status)) {
      res.status(400).json({ success: false, message: 'Invalid status' });
      return;
    }

    const targetUser = await db.queryOne<any>('SELECT role FROM users WHERE id = ?', [id]);
    if (!targetUser) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    if (targetUser.role === 'admin') {
      res.status(400).json({ success: false, message: 'Cannot suspend an administrator account.' });
      return;
    }

    await db.execute('UPDATE users SET status = ? WHERE id = ?', [status, id]);

    res.json({ success: true, message: `User status changed to ${status}.` });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to update user status.' });
  }
};

export const getAdminExchanges = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const exchanges = await db.query(
      `SELECT e.*,
        u1.name as initiator_name, u1.email as initiator_email,
        u2.name as recipient_name, u2.email as recipient_email,
        l1.title as initiator_listing_title,
        l2.title as recipient_listing_title
       FROM exchange_requests e
       JOIN users u1 ON e.initiator_id = u1.id
       JOIN users u2 ON e.recipient_id = u2.id
       JOIN skill_listings l1 ON e.initiator_listing_id = l1.id
       JOIN skill_listings l2 ON e.recipient_listing_id = l2.id
       ORDER BY e.created_at DESC`
    );

    res.json({ success: true, data: exchanges });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to retrieve exchanges.' });
  }
};

export const getAdminBookings = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const bookings = await db.query(
      `SELECT b.*,
        u_inst.name as instructor_name, u_inst.email as instructor_email,
        u_stud.name as student_name, u_stud.email as student_email,
        l.title as listing_title, l.skill_name
       FROM bookings b
       JOIN users u_inst ON b.instructor_id = u_inst.id
       JOIN users u_stud ON b.student_id = u_stud.id
       JOIN skill_listings l ON b.listing_id = l.id
       ORDER BY b.created_at DESC`
    );

    res.json({ success: true, data: bookings });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to retrieve bookings.' });
  }
};

export const getAdminReports = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const reports = await db.query(
      `SELECT r.*,
        u_rep.name as reporter_name,
        u_tgt.name as reported_user_name,
        l.title as listing_title
       FROM reports r
       JOIN users u_rep ON r.reporter_id = u_rep.id
       LEFT JOIN users u_tgt ON r.reported_user_id = u_tgt.id
       LEFT JOIN skill_listings l ON r.listing_id = l.id
       ORDER BY r.created_at DESC`
    );

    res.json({ success: true, data: reports });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to retrieve reports.' });
  }
};

export const resolveReport = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, admin_notes } = req.body;

    await db.execute(
      'UPDATE reports SET status = ?, admin_notes = ? WHERE id = ?',
      [status || 'reviewed', admin_notes || 'Resolved by admin', id]
    );

    res.json({ success: true, message: 'Report status updated.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to update report.' });
  }
};
