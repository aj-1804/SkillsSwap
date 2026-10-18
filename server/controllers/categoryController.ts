import { Request, Response } from 'express';
import { db } from '../config/database.ts';
import { AuthenticatedRequest } from '../middleware/auth.ts';

export const getCategories = async (_req: Request, res: Response): Promise<void> => {
  try {
    const categories = await db.query(
      `SELECT c.*, 
        (SELECT COUNT(*) FROM skill_listings WHERE category_id = c.id AND is_active = 1) as active_listings_count
       FROM categories c
       ORDER BY c.id ASC`
    );

    res.json({ success: true, data: categories });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to retrieve categories.' });
  }
};

export const createCategory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { name, slug, description, icon } = req.body;
    if (!name || !slug) {
      res.status(400).json({ success: false, message: 'Name and slug are required.' });
      return;
    }

    const result = await db.execute(
      'INSERT INTO categories (name, slug, description, icon) VALUES (?, ?, ?, ?)',
      [name.trim(), slug.trim().toLowerCase(), description || '', icon || 'BookOpen']
    );

    res.status(201).json({
      success: true,
      message: 'Category created successfully.',
      categoryId: result.insertId,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to create category.' });
  }
};
