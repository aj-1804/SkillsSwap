import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../config/database.ts';
import { signToken, AuthenticatedRequest } from '../middleware/auth.ts';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, location, languages, skills_offered, skills_wanted, availability } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
      return;
    }

    const existingUser = await db.queryOne('SELECT id FROM users WHERE email = ?', [email.trim().toLowerCase()]);
    if (existingUser) {
      res.status(400).json({ success: false, message: 'An account with this email address already exists.' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const defaultAvatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=0284c7,4f46e5,0d9488`;

    const result = await db.execute(
      `INSERT INTO users (name, email, password_hash, role, avatar_url, bio, location, languages, skills_offered, skills_wanted, availability, status)
       VALUES (?, ?, ?, 'student', ?, ?, ?, ?, ?, ?, ?, 'active')`,
      [
        name.trim(),
        email.trim().toLowerCase(),
        passwordHash,
        defaultAvatar,
        'Eager student learner and peer mentor on SkillSwap Global.',
        location || 'India',
        languages || 'English, Hindi',
        skills_offered || '',
        skills_wanted || '',
        availability || 'Flexible / Weekday Evenings',
      ]
    );

    const newUserId = result.insertId;

    // Send welcome notification
    await db.execute(
      `INSERT INTO notifications (user_id, type, title, message, link)
       VALUES (?, 'welcome', 'Welcome to SkillSwap Global!', 'Explore skills to learn, list your expertise to teach, or propose your first skill exchange!', '/explore')`,
      [newUserId]
    );

    const user = {
      id: newUserId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role: 'student' as const,
      avatar_url: defaultAvatar,
      location: location || 'India',
      languages: languages || 'English, Hindi',
      skills_offered: skills_offered || '',
      skills_wanted: skills_wanted || '',
      availability: availability || 'Flexible / Weekday Evenings',
      status: 'active' as const,
    };

    const token = signToken(user);

    res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      token,
      user,
    });
  } catch (err: any) {
    console.error('[Register Error]', err);
    res.status(500).json({ success: false, message: 'Internal server error during registration.' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Email and password are required.' });
      return;
    }

    const user = await db.queryOne<any>(
      `SELECT id, name, email, password_hash, role, avatar_url, bio, location, languages, skills_offered, skills_wanted, availability, status 
       FROM users WHERE email = ?`,
      [email.trim().toLowerCase()]
    );

    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid email or password.' });
      return;
    }

    if (user.status === 'suspended') {
      res.status(403).json({ success: false, message: 'Your account has been suspended by an administrator.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Invalid email or password.' });
      return;
    }

    const { password_hash, ...safeUser } = user;
    const token = signToken(safeUser);

    res.json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user: safeUser,
    });
  } catch (err: any) {
    console.error('[Login Error]', err);
    res.status(500).json({ success: false, message: 'Internal server error during login.' });
  }
};

export const getMe = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const user = await db.queryOne<any>(
      `SELECT id, name, email, role, avatar_url, bio, location, languages, skills_offered, skills_wanted, availability, status, points, subscription_tier, subscription_expires_at, created_at
       FROM users WHERE id = ?`,
      [req.user.id]
    );

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    // Unread notifications count
    const notifs = await db.queryOne<any>(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0',
      [user.id]
    );

    // Pending incoming exchange requests
    const exchanges = await db.queryOne<any>(
      "SELECT COUNT(*) as count FROM exchange_requests WHERE recipient_id = ? AND status = 'pending'",
      [user.id]
    );

    res.json({
      success: true,
      user: {
        ...user,
        unreadNotifications: Number(notifs?.count || 0),
        pendingExchangesCount: Number(exchanges?.count || 0),
      },
    });
  } catch (err: any) {
    console.error('[GetMe Error]', err);
    res.status(500).json({ success: false, message: 'Failed to fetch current user profile.' });
  }
};

export const updateProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { name, bio, location, languages, skills_offered, skills_wanted, availability, avatar_url } = req.body;

    await db.execute(
      `UPDATE users 
       SET name = COALESCE(?, name),
           bio = COALESCE(?, bio),
           location = COALESCE(?, location),
           languages = COALESCE(?, languages),
           skills_offered = COALESCE(?, skills_offered),
           skills_wanted = COALESCE(?, skills_wanted),
           availability = COALESCE(?, availability),
           avatar_url = COALESCE(?, avatar_url)
       WHERE id = ?`,
      [name, bio, location, languages, skills_offered, skills_wanted, availability, avatar_url, req.user.id]
    );

    const updatedUser = await db.queryOne<any>(
      `SELECT id, name, email, role, avatar_url, bio, location, languages, skills_offered, skills_wanted, availability, status 
       FROM users WHERE id = ?`,
      [req.user.id]
    );

    res.json({
      success: true,
      message: 'Profile updated successfully.',
      user: updatedUser,
    });
  } catch (err: any) {
    console.error('[UpdateProfile Error]', err);
    res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
};

export const changePassword = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { current_password, new_password } = req.body;
    if (!current_password || !new_password || new_password.length < 6) {
      res.status(400).json({ success: false, message: 'Current password and a new password with at least 6 characters are required.' });
      return;
    }

    const user = await db.queryOne<any>('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);
    const isMatch = await bcrypt.compare(current_password, user.password_hash);
    if (!isMatch) {
      res.status(400).json({ success: false, message: 'Current password is incorrect.' });
      return;
    }

    const newHash = await bcrypt.hash(new_password, 10);
    await db.execute('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, req.user.id]);

    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (err: any) {
    console.error('[ChangePassword Error]', err);
    res.status(500).json({ success: false, message: 'Failed to update password.' });
  }
};

export const getDemoAccounts = async (_req: Request, res: Response): Promise<void> => {
  try {
    const users = await db.query(
      `SELECT id, name, email, role, avatar_url, location, skills_offered, skills_wanted 
       FROM users WHERE status = 'active' ORDER BY (role = 'admin') DESC, id ASC LIMIT 15`
    );

    res.json({
      success: true,
      accounts: users.map(u => ({
        ...u,
        defaultPassword: 'Password@123',
      })),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to load demo accounts' });
  }
};
