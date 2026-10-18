import { Request, Response } from 'express';
import { db } from '../config/database.ts';
import { AuthenticatedRequest } from '../middleware/auth.ts';

export const getListings = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      search,
      category,
      proficiency,
      min_price,
      max_price,
      sort = 'newest',
      page = '1',
      limit = '12',
      is_active,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10) || 12));
    const offset = (pageNum - 1) * limitNum;

    let whereClauses: string[] = [];
    let params: any[] = [];

    // Filter active listings unless admin requests inactive
    if (is_active !== undefined) {
      whereClauses.push('l.is_active = ?');
      params.push(is_active === 'true' || is_active === '1' ? 1 : 0);
    } else {
      whereClauses.push('l.is_active = 1');
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      whereClauses.push('(l.title LIKE ? OR l.skill_name LIKE ? OR l.description LIKE ? OR u.name LIKE ?)');
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term);
    }

    if (category) {
      whereClauses.push('(c.slug = ? OR c.id = ?)');
      params.push(category, category);
    }

    if (proficiency && proficiency !== 'all') {
      whereClauses.push('l.proficiency_level = ?');
      params.push(proficiency);
    }

    if (min_price !== undefined && min_price !== '') {
      whereClauses.push('l.price_inr >= ?');
      params.push(Number(min_price));
    }

    if (max_price !== undefined && max_price !== '') {
      whereClauses.push('l.price_inr <= ?');
      params.push(Number(max_price));
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    let orderSql = 'ORDER BY l.created_at DESC';
    if (sort === 'price_asc') orderSql = 'ORDER BY l.price_inr ASC';
    else if (sort === 'price_desc') orderSql = 'ORDER BY l.price_inr DESC';
    else if (sort === 'rating_desc') orderSql = 'ORDER BY l.rating_avg DESC, l.total_reviews DESC';
    else if (sort === 'popular') orderSql = 'ORDER BY l.total_reviews DESC, l.rating_avg DESC';

    // Count query
    const countSql = `
      SELECT COUNT(*) as total
      FROM skill_listings l
      JOIN users u ON l.user_id = u.id
      JOIN categories c ON l.category_id = c.id
      ${whereSql}
    `;
    const countRes = await db.queryOne<{ total: number }>(countSql, params);
    const totalCount = Number(countRes?.total || 0);

    // Data query
    const dataSql = `
      SELECT 
        l.id, l.title, l.skill_name, l.description, l.proficiency_level, 
        l.session_duration_minutes, l.price_inr, l.teaching_availability, 
        l.supporting_link, l.is_active, l.rating_avg, l.total_reviews, l.created_at,
        u.id as user_id, u.name as user_name, u.avatar_url as user_avatar, u.location as user_location,
        c.id as category_id, c.name as category_name, c.slug as category_slug, c.icon as category_icon
      FROM skill_listings l
      JOIN users u ON l.user_id = u.id
      JOIN categories c ON l.category_id = c.id
      ${whereSql}
      ${orderSql}
      LIMIT ${limitNum} OFFSET ${offset}
    `;

    const listings = await db.query(dataSql, params);

    res.json({
      success: true,
      data: listings,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limitNum),
      },
    });
  } catch (err: any) {
    console.error('[GetListings Error]', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve skill listings.' });
  }
};

export const getListingById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const listing = await db.queryOne<any>(
      `SELECT 
        l.id, l.title, l.skill_name, l.description, l.proficiency_level, 
        l.session_duration_minutes, l.price_inr, l.teaching_availability, 
        l.supporting_link, l.is_active, l.rating_avg, l.total_reviews, l.created_at,
        u.id as user_id, u.name as user_name, u.email as user_email, u.avatar_url as user_avatar, 
        u.bio as user_bio, u.location as user_location, u.languages as user_languages,
        u.skills_offered as user_skills_offered, u.skills_wanted as user_skills_wanted,
        c.id as category_id, c.name as category_name, c.slug as category_slug
      FROM skill_listings l
      JOIN users u ON l.user_id = u.id
      JOIN categories c ON l.category_id = c.id
      WHERE l.id = ?`,
      [id]
    );

    if (!listing) {
      res.status(404).json({ success: false, message: 'Skill listing not found.' });
      return;
    }

    // Get reviews for this listing
    const reviews = await db.query(
      `SELECT r.id, r.rating, r.comment, r.created_at, u.id as reviewer_id, u.name as reviewer_name, u.avatar_url as reviewer_avatar
       FROM reviews r
       JOIN users u ON r.reviewer_id = u.id
       WHERE r.listing_id = ?
       ORDER BY r.created_at DESC LIMIT 10`,
      [id]
    );

    res.json({
      success: true,
      listing: {
        ...listing,
        reviews,
      },
    });
  } catch (err: any) {
    console.error('[GetListingById Error]', err);
    res.status(500).json({ success: false, message: 'Failed to fetch listing details.' });
  }
};

export const createListing = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const {
      category_id,
      title,
      skill_name,
      description,
      proficiency_level,
      session_duration_minutes = 60,
      price_inr = 0,
      teaching_availability,
      supporting_link,
    } = req.body;

    if (!title || !skill_name || !description || !proficiency_level || !teaching_availability) {
      res.status(400).json({ success: false, message: 'Please provide all required listing details.' });
      return;
    }

    const price = Math.max(0, Number(price_inr) || 0);

    const result = await db.execute(
      `INSERT INTO skill_listings 
        (user_id, category_id, title, skill_name, description, proficiency_level, session_duration_minutes, price_inr, teaching_availability, supporting_link, is_active, rating_avg, total_reviews)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 5.00, 0)`,
      [
        req.user.id,
        category_id || 1,
        title.trim(),
        skill_name.trim(),
        description.trim(),
        proficiency_level,
        Number(session_duration_minutes) || 60,
        price,
        teaching_availability.trim(),
        supporting_link ? supporting_link.trim() : null,
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Skill listing published successfully.',
      listingId: result.insertId,
    });
  } catch (err: any) {
    console.error('[CreateListing Error]', err);
    res.status(500).json({ success: false, message: 'Failed to create skill listing.' });
  }
};

export const updateListing = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    const listing = await db.queryOne<any>('SELECT user_id FROM skill_listings WHERE id = ?', [id]);
    if (!listing) {
      res.status(404).json({ success: false, message: 'Listing not found.' });
      return;
    }

    // Ownership check: user must be listing owner or admin
    if (listing.user_id !== req.user.id && req.user.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Permission denied. You can only update your own listings.' });
      return;
    }

    const {
      category_id,
      title,
      skill_name,
      description,
      proficiency_level,
      session_duration_minutes,
      price_inr,
      teaching_availability,
      supporting_link,
      is_active,
    } = req.body;

    await db.execute(
      `UPDATE skill_listings
       SET category_id = COALESCE(?, category_id),
           title = COALESCE(?, title),
           skill_name = COALESCE(?, skill_name),
           description = COALESCE(?, description),
           proficiency_level = COALESCE(?, proficiency_level),
           session_duration_minutes = COALESCE(?, session_duration_minutes),
           price_inr = COALESCE(?, price_inr),
           teaching_availability = COALESCE(?, teaching_availability),
           supporting_link = COALESCE(?, supporting_link),
           is_active = COALESCE(?, is_active)
       WHERE id = ?`,
      [
        category_id,
        title,
        skill_name,
        description,
        proficiency_level,
        session_duration_minutes,
        price_inr !== undefined ? Number(price_inr) : null,
        teaching_availability,
        supporting_link,
        is_active,
        id,
      ]
    );

    res.json({ success: true, message: 'Listing updated successfully.' });
  } catch (err: any) {
    console.error('[UpdateListing Error]', err);
    res.status(500).json({ success: false, message: 'Failed to update listing.' });
  }
};

export const deleteListing = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    const listing = await db.queryOne<any>('SELECT user_id FROM skill_listings WHERE id = ?', [id]);
    if (!listing) {
      res.status(404).json({ success: false, message: 'Listing not found.' });
      return;
    }

    if (listing.user_id !== req.user.id && req.user.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Permission denied. You can only delete your own listings.' });
      return;
    }

    await db.execute('DELETE FROM skill_listings WHERE id = ?', [id]);
    res.json({ success: true, message: 'Listing removed successfully.' });
  } catch (err: any) {
    console.error('[DeleteListing Error]', err);
    res.status(500).json({ success: false, message: 'Failed to delete listing.' });
  }
};

export const getMyListings = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const listings = await db.query(
      `SELECT l.*, c.name as category_name
       FROM skill_listings l
       JOIN categories c ON l.category_id = c.id
       WHERE l.user_id = ?
       ORDER BY l.created_at DESC`,
      [req.user.id]
    );

    res.json({ success: true, data: listings });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to retrieve listings.' });
  }
};
