import { Request, Response } from 'express';
import { db } from '../config/database.ts';
import { AuthenticatedRequest } from '../middleware/auth.ts';

export const getQuizzes = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { category, difficulty, search, mine } = req.query;
    const userId = req.user?.id;

    let sql = `
      SELECT q.*, u.name as creator_name, u.avatar_url as creator_avatar,
             (SELECT COUNT(*) FROM quiz_questions WHERE quiz_id = q.id) as question_count
      FROM quizzes q
      JOIN users u ON q.creator_id = u.id
      WHERE q.is_public = 1
    `;
    const params: any[] = [];

    if (category && category !== 'All') {
      sql += ' AND (q.skill_category = ? OR q.skill_category LIKE ?)';
      params.push(category, `%${category}%`);
    }

    if (difficulty && difficulty !== 'all') {
      sql += ' AND q.difficulty = ?';
      params.push(difficulty);
    }

    if (search) {
      sql += ' AND (q.title LIKE ? OR q.description LIKE ? OR q.skill_category LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    if (mine === 'true' && userId) {
      sql += ' AND q.creator_id = ?';
      params.push(userId);
    }

    sql += ' ORDER BY q.created_at DESC';

    const quizzes = await db.query(sql, params);

    // If user is authenticated, attach their best attempt
    let userAttemptsMap: Record<number, any> = {};
    if (userId) {
      const attempts = await db.query(
        `SELECT quiz_id, MAX(score) as best_score, MAX(percentage) as best_percentage, COUNT(*) as attempt_count
         FROM quiz_attempts
         WHERE user_id = ?
         GROUP BY quiz_id`,
        [userId]
      );
      for (const a of attempts) {
        userAttemptsMap[a.quiz_id] = a;
      }
    }

    const enrichedQuizzes = quizzes.map((q: any) => ({
      ...q,
      userAttempt: userAttemptsMap[q.id] || null,
    }));

    res.json({ success: true, quizzes: enrichedQuizzes });
  } catch (err: any) {
    console.error('[GetQuizzes Error]', err);
    res.status(500).json({ success: false, message: 'Failed to fetch quizzes' });
  }
};

export const getQuizById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const quizId = parseInt(req.params.id, 10);
    const userId = req.user?.id;

    const quiz = await db.queryOne<any>(
      `SELECT q.*, u.name as creator_name, u.avatar_url as creator_avatar, u.bio as creator_bio
       FROM quizzes q
       JOIN users u ON q.creator_id = u.id
       WHERE q.id = ?`,
      [quizId]
    );

    if (!quiz) {
      res.status(404).json({ success: false, message: 'Quiz not found' });
      return;
    }

    const rawQuestions = await db.query(
      'SELECT id, quiz_id, question_text, options_json, correct_option_index, explanation, order_num FROM quiz_questions WHERE quiz_id = ? ORDER BY order_num ASC',
      [quizId]
    );

    // Determine if requester is creator or admin, or has already passed
    const isCreatorOrAdmin = userId && (userId === quiz.creator_id || req.user?.role === 'admin');
    let hasCompleted = false;
    let latestAttempt = null;

    if (userId) {
      latestAttempt = await db.queryOne<any>(
        'SELECT * FROM quiz_attempts WHERE quiz_id = ? AND user_id = ? ORDER BY created_at DESC LIMIT 1',
        [quizId, userId]
      );
      if (latestAttempt && latestAttempt.percentage >= 70) {
        hasCompleted = true;
      }
    }

    const questions = rawQuestions.map((q: any) => {
      let options: string[] = [];
      try {
        options = JSON.parse(q.options_json);
      } catch {
        options = [];
      }

      // Hide answers unless creator, admin, or user already completed
      const showAnswers = isCreatorOrAdmin || hasCompleted;

      return {
        id: q.id,
        quiz_id: q.quiz_id,
        question_text: q.question_text,
        options,
        order_num: q.order_num,
        ...(showAnswers ? {
          correct_option_index: q.correct_option_index,
          explanation: q.explanation,
        } : {}),
      };
    });

    res.json({
      success: true,
      quiz: {
        ...quiz,
        questions,
        question_count: questions.length,
        latestAttempt,
      },
    });
  } catch (err: any) {
    console.error('[GetQuizById Error]', err);
    res.status(500).json({ success: false, message: 'Failed to fetch quiz details' });
  }
};

export const getQuizByShareCode = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { code } = req.params;
    const quiz = await db.queryOne<any>(
      'SELECT id FROM quizzes WHERE share_code = ?',
      [code.trim().toUpperCase()]
    );

    if (!quiz) {
      res.status(404).json({ success: false, message: 'No quiz found with this share code' });
      return;
    }

    req.params.id = quiz.id.toString();
    return getQuizById(req, res);
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to look up quiz by share code' });
  }
};

export const createQuiz = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const {
      title,
      description,
      skill_category,
      difficulty,
      time_limit_minutes,
      reward_points,
      questions,
      contest_id,
    } = req.body;

    if (!title || !skill_category || !Array.isArray(questions) || questions.length < 2) {
      res.status(400).json({
        success: false,
        message: 'Quiz must have a title, category, and at least 2 questions with 4 choices each.',
      });
      return;
    }

    // Generate unique share code
    const cleanCategory = (skill_category || 'SKILL').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5);
    const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
    const shareCode = `QUIZ-${cleanCategory}-${randomHex}`;

    const limitMinutes = parseInt(time_limit_minutes, 10) || 5;
    const points = parseInt(reward_points, 10) || 50;

    const quizResult = await db.execute(
      `INSERT INTO quizzes 
       (creator_id, title, description, skill_category, difficulty, time_limit_minutes, reward_points, share_code, is_public, contest_id, total_plays, avg_score)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, 0, 0.0)`,
      [
        req.user.id,
        title.trim(),
        description || '',
        skill_category.trim(),
        difficulty || 'intermediate',
        limitMinutes,
        points,
        shareCode,
        contest_id || null,
      ]
    );

    const quizId = quizResult.insertId;

    // Insert questions
    let orderNum = 1;
    for (const q of questions) {
      if (!q.question_text || !Array.isArray(q.options) || q.options.length < 2) {
        continue;
      }
      const correctIdx = typeof q.correct_option_index === 'number' ? q.correct_option_index : 0;
      await db.execute(
        `INSERT INTO quiz_questions 
         (quiz_id, question_text, options_json, correct_option_index, explanation, order_num)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          quizId,
          q.question_text.trim(),
          JSON.stringify(q.options),
          correctIdx,
          q.explanation || 'Review peer learning materials to master this concept.',
          orderNum++,
        ]
      );
    }

    // Award +50 creator community bonus points!
    const creatorBonus = 50;
    await db.execute('UPDATE users SET points = COALESCE(points, 0) + ? WHERE id = ?', [creatorBonus, req.user.id]);
    await db.execute(
      `INSERT INTO point_transactions (user_id, amount, transaction_type, description, reference_id)
       VALUES (?, ?, 'quiz_created_bonus', ?, ?)`,
      [req.user.id, creatorBonus, `Created interactive learning quiz: ${title.trim()}`, shareCode]
    );

    await db.execute(
      `INSERT INTO notifications (user_id, type, title, message, link)
       VALUES (?, 'quiz_created', 'Quiz Published & +50 Points Awarded!', ?, ?)`,
      [
        req.user.id,
        `Your quiz "${title.trim()}" is live! Share code: ${shareCode}. You received +50 bonus reward points.`,
        `/quiz/${quizId}`,
      ]
    );

    res.status(201).json({
      success: true,
      message: `Quiz created successfully! You earned +${creatorBonus} reward points.`,
      quizId,
      shareCode,
    });
  } catch (err: any) {
    console.error('[CreateQuiz Error]', err);
    res.status(500).json({ success: false, message: 'Failed to create quiz' });
  }
};

export const submitQuiz = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required to record score and points' });
      return;
    }

    const quizId = parseInt(req.params.id, 10);
    const { answers, time_taken_seconds, contest_id } = req.body;

    if (!Array.isArray(answers)) {
      res.status(400).json({ success: false, message: 'Answers array is required' });
      return;
    }

    const quiz = await db.queryOne<any>('SELECT * FROM quizzes WHERE id = ?', [quizId]);
    if (!quiz) {
      res.status(404).json({ success: false, message: 'Quiz not found' });
      return;
    }

    const questions = await db.query<any>(
      'SELECT id, question_text, options_json, correct_option_index, explanation, order_num FROM quiz_questions WHERE quiz_id = ? ORDER BY order_num ASC',
      [quizId]
    );

    if (questions.length === 0) {
      res.status(400).json({ success: false, message: 'Quiz has no questions configured' });
      return;
    }

    let correctCount = 0;
    const reviewBreakdown = questions.map((q: any, idx: number) => {
      const selectedIndex = answers[idx] !== undefined ? answers[idx] : -1;
      const isCorrect = selectedIndex === q.correct_option_index;
      if (isCorrect) correctCount++;

      let options: string[] = [];
      try {
        options = JSON.parse(q.options_json);
      } catch {
        options = [];
      }

      return {
        id: q.id,
        question_text: q.question_text,
        options,
        userSelected: selectedIndex,
        correct_option_index: q.correct_option_index,
        isCorrect,
        explanation: q.explanation,
      };
    });

    const totalQuestions = questions.length;
    const percentage = Math.round((correctCount / totalQuestions) * 100);
    const timeSpent = parseInt(time_taken_seconds, 10) || 60;

    // Check if user has previously passed and earned points for this quiz
    const previousPassedAttempt = await db.queryOne<any>(
      'SELECT id FROM quiz_attempts WHERE quiz_id = ? AND user_id = ? AND percentage >= 70',
      [quizId, req.user.id]
    );

    let pointsAwarded = 0;
    // Award points if percentage >= 70 and not previously awarded
    if (percentage >= 70 && !previousPassedAttempt) {
      pointsAwarded = quiz.reward_points || 50;

      // Update user points
      await db.execute('UPDATE users SET points = COALESCE(points, 0) + ? WHERE id = ?', [pointsAwarded, req.user.id]);

      // Record point transaction
      await db.execute(
        `INSERT INTO point_transactions (user_id, amount, transaction_type, description, reference_id)
         VALUES (?, ?, 'quiz_completed', ?, ?)`,
        [req.user.id, pointsAwarded, `Scored ${percentage}% on "${quiz.title}"`, `QUIZ-${quiz.id}`]
      );

      // Award creator +10 royalty points if user is not creator
      if (quiz.creator_id !== req.user.id) {
        const royalty = 10;
        await db.execute('UPDATE users SET points = COALESCE(points, 0) + ? WHERE id = ?', [royalty, quiz.creator_id]);
        await db.execute(
          `INSERT INTO point_transactions (user_id, amount, transaction_type, description, reference_id)
           VALUES (?, ?, 'quiz_royalty', ?, ?)`,
          [quiz.creator_id, royalty, `Student passed your quiz "${quiz.title}"`, `QUIZ-${quiz.id}`]
        );
      }
    }

    // Record attempt
    await db.execute(
      `INSERT INTO quiz_attempts 
       (quiz_id, user_id, contest_id, score, total_questions, percentage, time_taken_seconds, points_awarded, answers_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        quizId,
        req.user.id,
        contest_id || null,
        correctCount,
        totalQuestions,
        percentage,
        timeSpent,
        pointsAwarded,
        JSON.stringify(answers),
      ]
    );

    // Update quiz plays & average score
    const totalPlays = (quiz.total_plays || 0) + 1;
    const newAvg = Number((((quiz.avg_score || 0) * (totalPlays - 1) + percentage) / totalPlays).toFixed(1));
    await db.execute('UPDATE quizzes SET total_plays = ?, avg_score = ? WHERE id = ?', [totalPlays, newAvg, quizId]);

    // Fetch user's updated total points
    const updatedUser = await db.queryOne<any>('SELECT points FROM users WHERE id = ?', [req.user.id]);

    res.json({
      success: true,
      result: {
        quizId,
        quizTitle: quiz.title,
        score: correctCount,
        totalQuestions,
        percentage,
        timeSpent,
        passed: percentage >= 70,
        pointsAwarded,
        userTotalPoints: updatedUser?.points || 0,
        alreadyEarnedPreviously: Boolean(previousPassedAttempt),
        review: reviewBreakdown,
      },
    });
  } catch (err: any) {
    console.error('[SubmitQuiz Error]', err);
    res.status(500).json({ success: false, message: 'Failed to submit quiz' });
  }
};

export const getQuizLeaderboard = async (req: Request, res: Response): Promise<void> => {
  try {
    const quizId = parseInt(req.params.id, 10);
    const leaders = await db.query(
      `SELECT qa.score, qa.total_questions, qa.percentage, qa.time_taken_seconds, qa.created_at,
              u.id as user_id, u.name as user_name, u.avatar_url as user_avatar, u.location as user_location
       FROM quiz_attempts qa
       JOIN users u ON qa.user_id = u.id
       WHERE qa.quiz_id = ?
       ORDER BY qa.percentage DESC, qa.time_taken_seconds ASC
       LIMIT 10`,
      [quizId]
    );

    res.json({ success: true, leaders });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to load quiz leaderboard' });
  }
};

export const getUserQuizStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const created = await db.queryOne<any>('SELECT COUNT(*) as count FROM quizzes WHERE creator_id = ?', [req.user.id]);
    const attempted = await db.queryOne<any>('SELECT COUNT(*) as count, AVG(percentage) as avg_score FROM quiz_attempts WHERE user_id = ?', [req.user.id]);
    const user = await db.queryOne<any>('SELECT points, subscription_tier, subscription_expires_at FROM users WHERE id = ?', [req.user.id]);

    res.json({
      success: true,
      stats: {
        quizzesCreated: Number(created?.count || 0),
        quizzesAttempted: Number(attempted?.count || 0),
        averageScore: Number(attempted?.avg_score || 0).toFixed(1),
        currentPoints: user?.points || 0,
        subscriptionTier: user?.subscription_tier || 'free',
        subscriptionExpiresAt: user?.subscription_expires_at || null,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch user quiz stats' });
  }
};
