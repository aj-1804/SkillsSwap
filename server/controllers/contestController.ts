import { Request, Response } from 'express';
import { db } from '../config/database.ts';
import { AuthenticatedRequest } from '../middleware/auth.ts';

export const getContests = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const contests = await db.query(
      `SELECT c.*, u.name as admin_name,
              (SELECT COUNT(*) FROM contest_quizzes WHERE contest_id = c.id) as quiz_count,
              (SELECT COUNT(*) FROM contest_participants WHERE contest_id = c.id) as participant_count
       FROM global_contests c
       JOIN users u ON c.creator_admin_id = u.id
       ORDER BY (c.status = 'active') DESC, c.start_date DESC`
    );

    let userParticipationMap: Record<number, any> = {};
    if (userId) {
      const participations = await db.query(
        'SELECT * FROM contest_participants WHERE user_id = ?',
        [userId]
      );
      for (const p of participations) {
        userParticipationMap[p.contest_id] = p;
      }
    }

    const enriched = contests.map((c: any) => ({
      ...c,
      userParticipation: userParticipationMap[c.id] || null,
    }));

    res.json({ success: true, contests: enriched });
  } catch (err: any) {
    console.error('[GetContests Error]', err);
    res.status(500).json({ success: false, message: 'Failed to fetch global contests' });
  }
};

export const getContestById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const contestId = parseInt(req.params.id, 10);
    const userId = req.user?.id;

    const contest = await db.queryOne<any>(
      `SELECT c.*, u.name as admin_name
       FROM global_contests c
       JOIN users u ON c.creator_admin_id = u.id
       WHERE c.id = ?`,
      [contestId]
    );

    if (!contest) {
      res.status(404).json({ success: false, message: 'Contest not found' });
      return;
    }

    // Get quizzes linked to this contest
    const quizzes = await db.query(
      `SELECT q.*, cq.round_number,
              (SELECT COUNT(*) FROM quiz_questions WHERE quiz_id = q.id) as question_count
       FROM contest_quizzes cq
       JOIN quizzes q ON cq.quiz_id = q.id
       WHERE cq.contest_id = ?
       ORDER BY cq.round_number ASC`,
      [contestId]
    );

    // Get leaderboard
    const leaderboard = await db.query(
      `SELECT cp.*, u.name as user_name, u.avatar_url as user_avatar, u.location as user_location
       FROM contest_participants cp
       JOIN users u ON cp.user_id = u.id
       WHERE cp.contest_id = ?
       ORDER BY cp.total_score DESC, cp.total_time_seconds ASC
       LIMIT 20`,
      [contestId]
    );

    // Check user's participation
    let userParticipation = null;
    let completedQuizzes: number[] = [];
    if (userId) {
      userParticipation = await db.queryOne<any>(
        'SELECT * FROM contest_participants WHERE contest_id = ? AND user_id = ?',
        [contestId, userId]
      );

      const userAttempts = await db.query(
        'SELECT quiz_id FROM quiz_attempts WHERE contest_id = ? AND user_id = ?',
        [contestId, userId]
      );
      completedQuizzes = userAttempts.map((a: any) => a.quiz_id);
    }

    res.json({
      success: true,
      contest: {
        ...contest,
        quizzes,
        leaderboard,
        userParticipation,
        completedQuizzes,
      },
    });
  } catch (err: any) {
    console.error('[GetContestById Error]', err);
    res.status(500).json({ success: false, message: 'Failed to fetch contest details' });
  }
};

export const createContest = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Only administrators can create global contests.' });
      return;
    }

    const {
      title,
      description,
      cover_image,
      entry_type,
      entry_fee_inr,
      start_date,
      end_date,
      prize_pool_points,
      rank_1_points,
      rank_2_points,
      rank_3_points,
      participation_points,
      quiz_ids,
    } = req.body;

    if (!title || !description || !start_date || !end_date) {
      res.status(400).json({ success: false, message: 'Title, description, start and end dates are required.' });
      return;
    }

    const fee = entry_type === 'paid' ? Math.max(0, parseFloat(entry_fee_inr) || 49.0) : 0.0;
    const pool = parseInt(prize_pool_points, 10) || 5000;
    const r1 = parseInt(rank_1_points, 10) || 2500;
    const r2 = parseInt(rank_2_points, 10) || 1500;
    const r3 = parseInt(rank_3_points, 10) || 750;
    const part = parseInt(participation_points, 10) || 100;

    const defaultCover = entry_type === 'paid'
      ? 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80'
      : 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80';

    const result = await db.execute(
      `INSERT INTO global_contests
       (creator_admin_id, title, description, cover_image, entry_type, entry_fee_inr, status, start_date, end_date, prize_pool_points, rank_1_points, rank_2_points, rank_3_points, participation_points)
       VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        title.trim(),
        description.trim(),
        cover_image || defaultCover,
        entry_type || 'free',
        fee,
        start_date,
        end_date,
        pool,
        r1,
        r2,
        r3,
        part,
      ]
    );

    const contestId = result.insertId;

    // Link quizzes
    if (Array.isArray(quiz_ids)) {
      let roundNum = 1;
      for (const qid of quiz_ids) {
        await db.execute(
          'INSERT INTO contest_quizzes (contest_id, quiz_id, round_number) VALUES (?, ?, ?)',
          [contestId, qid, roundNum++]
        );
      }
    }

    // Broadcast notification to all active students
    const students = await db.query('SELECT id FROM users WHERE role = "student" AND status = "active"');
    for (const s of students) {
      await db.execute(
        `INSERT INTO notifications (user_id, type, title, message, link)
         VALUES (?, 'contest_announced', 'New Global Contest Live!', ?, ?)`,
        [
          s.id,
          `Administrator Amit Jha launched "${title.trim()}"! Prize pool: ${pool.toLocaleString()} points.`,
          `/contests`,
        ]
      );
    }

    res.status(201).json({
      success: true,
      message: 'Global contest launched successfully!',
      contestId,
    });
  } catch (err: any) {
    console.error('[CreateContest Error]', err);
    res.status(500).json({ success: false, message: 'Failed to create contest' });
  }
};

export const joinContest = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const contestId = parseInt(req.params.id, 10);
    const { payment_id } = req.body;

    const contest = await db.queryOne<any>('SELECT * FROM global_contests WHERE id = ?', [contestId]);
    if (!contest) {
      res.status(404).json({ success: false, message: 'Contest not found' });
      return;
    }

    // Check if already joined
    const existing = await db.queryOne<any>(
      'SELECT id FROM contest_participants WHERE contest_id = ? AND user_id = ?',
      [contestId, req.user.id]
    );

    if (existing) {
      res.json({ success: true, message: 'Already registered for this contest', participantId: existing.id });
      return;
    }

    // Check if Pro member gets free entry to paid contests!
    const user = await db.queryOne<any>('SELECT subscription_tier FROM users WHERE id = ?', [req.user.id]);
    const isPro = user?.subscription_tier === 'pro_master' || user?.subscription_tier === 'vip_annual';

    if (contest.entry_type === 'paid' && !isPro && !payment_id) {
      res.status(402).json({
        success: false,
        message: `This is a premium global contest requiring ₹${contest.entry_fee_inr} entry fee or Pro Master subscription.`,
        fee: contest.entry_fee_inr,
      });
      return;
    }

    const result = await db.execute(
      `INSERT INTO contest_participants 
       (contest_id, user_id, payment_id, total_score, total_time_seconds, quizzes_completed, rank, points_rewarded)
       VALUES (?, ?, ?, 0, 0, 0, NULL, 0)`,
      [contestId, req.user.id, payment_id || null]
    );

    res.status(201).json({
      success: true,
      message: 'Successfully enrolled in contest! Good luck!',
      participantId: result.insertId,
    });
  } catch (err: any) {
    console.error('[JoinContest Error]', err);
    res.status(500).json({ success: false, message: 'Failed to join contest' });
  }
};

export const submitContestRound = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const contestId = parseInt(req.params.id, 10);
    const { quiz_id, answers, time_taken_seconds } = req.body;

    const contest = await db.queryOne<any>('SELECT * FROM global_contests WHERE id = ?', [contestId]);
    if (!contest) {
      res.status(404).json({ success: false, message: 'Contest not found' });
      return;
    }

    const participant = await db.queryOne<any>(
      'SELECT * FROM contest_participants WHERE contest_id = ? AND user_id = ?',
      [contestId, req.user.id]
    );

    if (!participant) {
      res.status(403).json({ success: false, message: 'You must join the contest first.' });
      return;
    }

    // Grade questions
    const questions = await db.query<any>(
      'SELECT id, correct_option_index FROM quiz_questions WHERE quiz_id = ? ORDER BY order_num ASC',
      [quiz_id]
    );

    let score = 0;
    questions.forEach((q, idx) => {
      if (answers && answers[idx] === q.correct_option_index) {
        score++;
      }
    });

    const timeSpent = parseInt(time_taken_seconds, 10) || 60;
    const percentage = Math.round((score / questions.length) * 100);

    // Save attempt
    await db.execute(
      `INSERT INTO quiz_attempts (quiz_id, user_id, contest_id, score, total_questions, percentage, time_taken_seconds, points_awarded, answers_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)`,
      [quiz_id, req.user.id, contestId, score, questions.length, percentage, timeSpent, JSON.stringify(answers)]
    );

    // Update participant record
    const updatedScore = (participant.total_score || 0) + score;
    const updatedTime = (participant.total_time_seconds || 0) + timeSpent;
    const updatedQuizzesCompleted = (participant.quizzes_completed || 0) + 1;

    // Check total quizzes in this contest
    const totalContestQuizzes = await db.queryOne<any>(
      'SELECT COUNT(*) as count FROM contest_quizzes WHERE contest_id = ?',
      [contestId]
    );

    const isAllCompleted = updatedQuizzesCompleted >= Number(totalContestQuizzes?.count || 1);
    let pointsAwarded = 0;

    if (isAllCompleted && participant.points_rewarded === 0) {
      pointsAwarded = contest.participation_points || 100;
      await db.execute('UPDATE users SET points = COALESCE(points, 0) + ? WHERE id = ?', [pointsAwarded, req.user.id]);
      await db.execute(
        `INSERT INTO point_transactions (user_id, amount, transaction_type, description, reference_id)
         VALUES (?, ?, 'contest_participation', ?, ?)`,
        [req.user.id, pointsAwarded, `Completed all rounds of ${contest.title}`, `CONTEST-${contestId}`]
      );
    }

    await db.execute(
      `UPDATE contest_participants 
       SET total_score = ?, total_time_seconds = ?, quizzes_completed = ?, 
           points_rewarded = points_rewarded + ?, completed_at = ?
       WHERE id = ?`,
      [
        updatedScore,
        updatedTime,
        updatedQuizzesCompleted,
        pointsAwarded,
        isAllCompleted ? new Date().toISOString() : null,
        participant.id,
      ]
    );

    // Recalculate ranks for this contest
    const allParticipants = await db.query(
      `SELECT id FROM contest_participants 
       WHERE contest_id = ? 
       ORDER BY total_score DESC, total_time_seconds ASC`,
      [contestId]
    );

    let rank = 1;
    for (const p of allParticipants) {
      await db.execute('UPDATE contest_participants SET rank = ? WHERE id = ?', [rank++, p.id]);
    }

    const currentRank = allParticipants.findIndex((p: any) => p.id === participant.id) + 1;

    res.json({
      success: true,
      message: isAllCompleted ? `Contest finished! Earned +${pointsAwarded} points!` : 'Round completed!',
      score,
      totalQuestions: questions.length,
      currentRank,
      isAllCompleted,
      pointsAwarded,
    });
  } catch (err: any) {
    console.error('[SubmitContestRound Error]', err);
    res.status(500).json({ success: false, message: 'Failed to record contest round' });
  }
};

export const distributePrizes = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Admin access required' });
      return;
    }

    const contestId = parseInt(req.params.id, 10);
    const contest = await db.queryOne<any>('SELECT * FROM global_contests WHERE id = ?', [contestId]);
    if (!contest) {
      res.status(404).json({ success: false, message: 'Contest not found' });
      return;
    }

    // Fetch top 3 participants
    const topWinners = await db.query<any>(
      `SELECT cp.*, u.name, u.email
       FROM contest_participants cp
       JOIN users u ON cp.user_id = u.id
       WHERE cp.contest_id = ? AND cp.quizzes_completed > 0
       ORDER BY cp.total_score DESC, cp.total_time_seconds ASC
       LIMIT 3`,
      [contestId]
    );

    const prizeTable = [contest.rank_1_points, contest.rank_2_points, contest.rank_3_points];
    const titles = ['1st Place Champion', '2nd Place Runner-Up', '3rd Place Bronze'];

    for (let i = 0; i < topWinners.length; i++) {
      const winner = topWinners[i];
      const pts = prizeTable[i] || 500;
      await db.execute('UPDATE users SET points = COALESCE(points, 0) + ? WHERE id = ?', [pts, winner.user_id]);
      await db.execute(
        `INSERT INTO point_transactions (user_id, amount, transaction_type, description, reference_id)
         VALUES (?, ?, 'contest_winner_prize', ?, ?)`,
        [winner.user_id, pts, `${titles[i]} in ${contest.title}!`, `CONTEST-${contestId}`]
      );

      await db.execute(
        `INSERT INTO notifications (user_id, type, title, message, link)
         VALUES (?, 'contest_prize', ?, ?, ?)`,
        [
          winner.user_id,
          `Congratulations! You Won ${pts} Points!`,
          `You secured ${titles[i]} in "${contest.title}". ${pts} points added to your wallet!`,
          '/rewards',
        ]
      );
    }

    await db.execute('UPDATE global_contests SET status = "completed" WHERE id = ?', [contestId]);

    res.json({
      success: true,
      message: `Prizes successfully awarded to top ${topWinners.length} competitors!`,
      winners: topWinners.map((w, idx) => ({ ...w, points: prizeTable[idx] })),
    });
  } catch (err: any) {
    console.error('[DistributePrizes Error]', err);
    res.status(500).json({ success: false, message: 'Failed to distribute prizes' });
  }
};
