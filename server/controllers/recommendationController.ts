import { Response } from 'express';
import { db } from '../config/database.ts';
import { AuthenticatedRequest } from '../middleware/auth.ts';

export const getRecommendations = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const currentUserId = req.user?.id;

    // Fetch currentUser's profile if logged in
    let currentUser: any = null;
    if (currentUserId) {
      currentUser = await db.queryOne<any>('SELECT * FROM users WHERE id = ?', [currentUserId]);
    }

    // Fetch all active listings except the user's own
    const whereSql = currentUserId ? 'WHERE l.is_active = 1 AND l.user_id != ?' : 'WHERE l.is_active = 1';
    const params = currentUserId ? [currentUserId] : [];

    const listings = await db.query(
      `SELECT 
        l.*, 
        u.name as user_name, u.avatar_url as user_avatar, u.location as user_location,
        u.skills_offered as user_skills_offered, u.skills_wanted as user_skills_wanted,
        c.name as category_name
       FROM skill_listings l
       JOIN users u ON l.user_id = u.id
       JOIN categories c ON l.category_id = c.id
       ${whereSql}
       ORDER BY l.rating_avg DESC, l.total_reviews DESC`,
      params
    );

    // Fetch user's listings to find exchange synergies
    let myOfferings: any[] = [];
    if (currentUserId) {
      myOfferings = await db.query('SELECT * FROM skill_listings WHERE user_id = ? AND is_active = 1', [currentUserId]);
    }

    // Recommendation scoring and explanation generator
    const scoredListings = listings.map((l: any) => {
      let score = 10;
      let reasons: string[] = [];

      if (currentUser) {
        const wants = (currentUser.skills_wanted || '').toLowerCase();
        const offers = (currentUser.skills_offered || '').toLowerCase();
        const otherOffers = (l.user_skills_offered || '').toLowerCase();
        const otherWants = (l.user_skills_wanted || '').toLowerCase();
        const skillNameLower = (l.skill_name || '').toLowerCase();

        // 1. Direct match with skills current user wants to learn
        if (wants && (wants.includes(skillNameLower) || skillNameLower.split(' ').some((w: string) => wants.includes(w)))) {
          score += 40;
          reasons.push(`matches your interest in learning ${l.skill_name}`);
        }

        // 2. Mutual exchange synergy: the instructor wants what current user offers!
        const mutualSkills = myOfferings.filter((myL: any) =>
          otherWants.includes(myL.skill_name.toLowerCase())
        );

        if (mutualSkills.length > 0) {
          score += 35;
          const mutual = mutualSkills[0];
          const isSameLevel = mutual.proficiency_level === l.proficiency_level;
          if (isSameLevel) {
            reasons.push(
              `${l.user_name} wants to learn ${mutual.skill_name} and you can offer it at an equal ${mutual.proficiency_level} level for a FREE skill swap`
            );
          } else {
            const diff = Math.abs(mutual.price_inr - l.price_inr);
            reasons.push(
              `${l.user_name} wants ${mutual.skill_name}. Perfect for skill exchange with only ₹${diff} price adjustment`
            );
          }
        }

        // 3. Price compatibility with student's average listed price
        if (myOfferings.length > 0) {
          const avgMyPrice = myOfferings.reduce((acc, curr) => acc + curr.price_inr, 0) / myOfferings.length;
          if (Math.abs(avgMyPrice - l.price_inr) <= 150) {
            score += 15;
            if (reasons.length === 0) {
              reasons.push(`closely aligns with your session price range (around ₹${l.price_inr})`);
            }
          }
        }
      }

      // Bonus for high ratings
      if (l.rating_avg >= 4.8) {
        score += 10;
        if (reasons.length === 0) {
          reasons.push(`highly rated student mentor (${l.rating_avg}★ with ${l.total_reviews} reviews)`);
        }
      }

      const defaultExplanation =
        reasons.length > 0
          ? `Recommended because ${reasons.join(', and ')}.`
          : `Recommended popular skill listing with strong student community feedback (${l.rating_avg}★).`;

      return {
        ...l,
        matchScore: score,
        recommendationReason: defaultExplanation,
      };
    });

    // Sort by match score descending
    scoredListings.sort((a, b) => b.matchScore - a.matchScore);

    res.json({
      success: true,
      data: scoredListings.slice(0, 8),
    });
  } catch (err: any) {
    console.error('[GetRecommendations Error]', err);
    res.status(500).json({ success: false, message: 'Failed to generate recommendations.' });
  }
};
