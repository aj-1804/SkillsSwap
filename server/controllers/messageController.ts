import { Response } from 'express';
import { db } from '../config/database.ts';
import { AuthenticatedRequest } from '../middleware/auth.ts';

export const getConversations = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const conversations = await db.query(
      `SELECT 
        c.id, c.participant1_id, c.participant2_id, c.updated_at,
        CASE WHEN c.participant1_id = ? THEN c.participant2_id ELSE c.participant1_id END as other_user_id,
        u.name as other_user_name, u.avatar_url as other_user_avatar, u.location as other_user_location,
        (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
        (SELECT created_at FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_time,
        (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id AND receiver_id = ? AND is_read = 0) as unread_count
      FROM conversations c
      JOIN users u ON u.id = (CASE WHEN c.participant1_id = ? THEN c.participant2_id ELSE c.participant1_id END)
      WHERE c.participant1_id = ? OR c.participant2_id = ?
      ORDER BY c.updated_at DESC`,
      [req.user.id, req.user.id, req.user.id, req.user.id, req.user.id]
    );

    res.json({ success: true, data: conversations });
  } catch (err: any) {
    console.error('[GetConversations Error]', err);
    res.status(500).json({ success: false, message: 'Failed to fetch conversations.' });
  }
};

export const getMessages = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { userId } = req.params;
    const targetUserId = parseInt(userId, 10);

    if (isNaN(targetUserId)) {
      res.status(400).json({ success: false, message: 'Invalid user ID' });
      return;
    }

    // Find conversation
    let conv = await db.queryOne<any>(
      `SELECT id FROM conversations 
       WHERE (participant1_id = ? AND participant2_id = ?) 
          OR (participant1_id = ? AND participant2_id = ?)`,
      [req.user.id, targetUserId, targetUserId, req.user.id]
    );

    if (!conv) {
      // Return empty messages list
      const otherUser = await db.queryOne<any>('SELECT id, name, avatar_url, location FROM users WHERE id = ?', [targetUserId]);
      res.json({
        success: true,
        messages: [],
        otherUser,
      });
      return;
    }

    // Mark unread messages as read
    await db.execute(
      'UPDATE messages SET is_read = 1 WHERE conversation_id = ? AND receiver_id = ?',
      [conv.id, req.user.id]
    );

    const messages = await db.query(
      `SELECT m.*, u.name as sender_name, u.avatar_url as sender_avatar
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       WHERE m.conversation_id = ?
       ORDER BY m.created_at ASC`,
      [conv.id]
    );

    const otherUser = await db.queryOne<any>('SELECT id, name, avatar_url, location FROM users WHERE id = ?', [targetUserId]);

    res.json({
      success: true,
      conversationId: conv.id,
      messages,
      otherUser,
    });
  } catch (err: any) {
    console.error('[GetMessages Error]', err);
    res.status(500).json({ success: false, message: 'Failed to fetch messages.' });
  }
};

export const sendMessage = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { receiver_id, content } = req.body;

    if (!receiver_id || !content || !content.trim()) {
      res.status(400).json({ success: false, message: 'Receiver and non-empty content are required.' });
      return;
    }

    const targetUserId = parseInt(receiver_id, 10);
    if (targetUserId === req.user.id) {
      res.status(400).json({ success: false, message: 'Cannot message yourself.' });
      return;
    }

    // Find or create conversation
    let conv = await db.queryOne<any>(
      `SELECT id FROM conversations 
       WHERE (participant1_id = ? AND participant2_id = ?) 
          OR (participant1_id = ? AND participant2_id = ?)`,
      [req.user.id, targetUserId, targetUserId, req.user.id]
    );

    let convId = conv?.id;
    if (!convId) {
      const p1 = Math.min(req.user.id, targetUserId);
      const p2 = Math.max(req.user.id, targetUserId);
      const convRes = await db.execute(
        'INSERT INTO conversations (participant1_id, participant2_id) VALUES (?, ?)',
        [p1, p2]
      );
      convId = convRes.insertId;
    } else {
      await db.execute('UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?', [convId]);
    }

    const msgRes = await db.execute(
      `INSERT INTO messages (conversation_id, sender_id, receiver_id, content, is_read)
       VALUES (?, ?, ?, ?, 0)`,
      [convId, req.user.id, targetUserId, content.trim()]
    );

    // Notify receiver
    await db.execute(
      `INSERT INTO notifications (user_id, type, title, message, link)
       VALUES (?, 'new_message', ?, ?, '/messages')`,
      [
        targetUserId,
        `New message from ${req.user.name}`,
        content.trim().slice(0, 80),
      ]
    );

    res.status(201).json({
      success: true,
      messageId: msgRes.insertId,
      message: {
        id: msgRes.insertId,
        conversation_id: convId,
        sender_id: req.user.id,
        receiver_id: targetUserId,
        content: content.trim(),
        created_at: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    console.error('[SendMessage Error]', err);
    res.status(500).json({ success: false, message: 'Failed to send message.' });
  }
};
