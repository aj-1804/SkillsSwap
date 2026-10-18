import { Router } from 'express';
import {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  getDemoAccounts,
} from '../controllers/authController.ts';
import {
  getListings,
  getListingById,
  createListing,
  updateListing,
  deleteListing,
  getMyListings,
} from '../controllers/listingController.ts';
import {
  createExchangeRequest,
  getMyExchanges,
  getExchangeById,
  acceptExchange,
  rejectExchange,
  confirmExchangeAfterPayment,
} from '../controllers/exchangeController.ts';
import {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
  completeBooking,
  confirmBookingPayment,
} from '../controllers/bookingController.ts';
import {
  createPaymentIntent,
  verifyPayment,
  getMyPayments,
} from '../controllers/paymentController.ts';
import { createReview } from '../controllers/reviewController.ts';
import {
  getConversations,
  getMessages,
  sendMessage,
} from '../controllers/messageController.ts';
import {
  getNotifications,
  markNotificationsRead,
} from '../controllers/notificationController.ts';
import { getCategories, createCategory } from '../controllers/categoryController.ts';
import { getRecommendations } from '../controllers/recommendationController.ts';
import { createReport } from '../controllers/reportController.ts';
import {
  getAdminStats,
  getAdminUsers,
  toggleUserStatus,
  getAdminExchanges,
  getAdminBookings,
  getAdminReports,
  resolveReport,
} from '../controllers/adminController.ts';
import {
  getQuizzes,
  getQuizById,
  getQuizByShareCode,
  createQuiz,
  submitQuiz,
  getQuizLeaderboard,
  getUserQuizStats,
} from '../controllers/quizController.ts';
import {
  getContests,
  getContestById,
  createContest,
  joinContest,
  submitContestRound,
  distributePrizes,
} from '../controllers/contestController.ts';
import {
  getRewards,
  getMyWallet,
  redeemReward,
  getMyRedemptions,
} from '../controllers/rewardController.ts';
import {
  authenticateJwt,
  requireAdmin,
  optionalAuth,
} from '../middleware/auth.ts';
import { db } from '../config/database.ts';

const router = Router();

// ==========================================
// Authentication & User Routes
// ==========================================
router.post('/auth/register', register);
router.post('/auth/login', login);
router.get('/auth/me', authenticateJwt, getMe);
router.get('/auth/demo-accounts', getDemoAccounts);
router.put('/users/me', authenticateJwt, updateProfile);
router.patch('/users/me/password', authenticateJwt, changePassword);

// Public user profile
router.get('/users/:id', async (req, res) => {
  try {
    const user = await db.queryOne<any>(
      `SELECT id, name, avatar_url, bio, location, languages, skills_offered, skills_wanted, availability, created_at
       FROM users WHERE id = ? AND status = 'active'`,
      [req.params.id]
    );
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }
    const listings = await db.query(
      'SELECT * FROM skill_listings WHERE user_id = ? AND is_active = 1',
      [req.params.id]
    );
    res.json({ success: true, user: { ...user, listings } });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to retrieve user profile' });
  }
});

// ==========================================
// Categories
// ==========================================
router.get('/categories', getCategories);
router.post('/categories', authenticateJwt, requireAdmin, createCategory);

// ==========================================
// Skill Listings
// ==========================================
router.get('/listings', getListings);
router.get('/listings/my', authenticateJwt, getMyListings);
router.get('/listings/:id', getListingById);
router.post('/listings', authenticateJwt, createListing);
router.put('/listings/:id', authenticateJwt, updateListing);
router.delete('/listings/:id', authenticateJwt, deleteListing);

// ==========================================
// Skill Exchanges (Rules 1 & 2)
// ==========================================
router.post('/exchanges', authenticateJwt, createExchangeRequest);
router.get('/exchanges/me', authenticateJwt, getMyExchanges);
router.get('/exchanges/:id', authenticateJwt, getExchangeById);
router.patch('/exchanges/:id/accept', authenticateJwt, acceptExchange);
router.patch('/exchanges/:id/reject', authenticateJwt, rejectExchange);
router.post('/exchanges/:id/confirm', authenticateJwt, confirmExchangeAfterPayment);

// ==========================================
// Direct Paid Bookings (Rule 3)
// ==========================================
router.post('/bookings', authenticateJwt, createBooking);
router.get('/bookings/me', authenticateJwt, getMyBookings);
router.get('/bookings/:id', authenticateJwt, getBookingById);
router.patch('/bookings/:id/cancel', authenticateJwt, cancelBooking);
router.patch('/bookings/:id/complete', authenticateJwt, completeBooking);
router.post('/bookings/:id/confirm', authenticateJwt, confirmBookingPayment);

// ==========================================
// Payments & Demo Gateway
// ==========================================
router.post('/payments/create', authenticateJwt, createPaymentIntent);
router.post('/payments/verify', authenticateJwt, verifyPayment);
router.get('/payments/me', authenticateJwt, getMyPayments);

// ==========================================
// Recommendations & Search
// ==========================================
router.get('/recommendations', optionalAuth, getRecommendations);

// ==========================================
// Reviews
// ==========================================
router.post('/reviews', authenticateJwt, createReview);

// ==========================================
// In-App Messaging
// ==========================================
router.get('/messages/conversations', authenticateJwt, getConversations);
router.get('/messages/conversation/:userId', authenticateJwt, getMessages);
router.post('/messages', authenticateJwt, sendMessage);

// ==========================================
// Notifications
// ==========================================
router.get('/notifications', authenticateJwt, getNotifications);
router.patch('/notifications/read-all', authenticateJwt, markNotificationsRead);

// ==========================================
// Reports
// ==========================================
router.post('/reports', authenticateJwt, createReport);

// ==========================================
// Admin Operations (Amit Jha)
// ==========================================
router.get('/admin/stats', authenticateJwt, requireAdmin, getAdminStats);
router.get('/admin/users', authenticateJwt, requireAdmin, getAdminUsers);
router.patch('/admin/users/:id/status', authenticateJwt, requireAdmin, toggleUserStatus);
router.get('/admin/exchanges', authenticateJwt, requireAdmin, getAdminExchanges);
router.get('/admin/bookings', authenticateJwt, requireAdmin, getAdminBookings);
router.get('/admin/reports', authenticateJwt, requireAdmin, getAdminReports);
router.patch('/admin/reports/:id/resolve', authenticateJwt, requireAdmin, resolveReport);

// ==========================================
// Interactive Quizzes (Learning & Sharing)
// ==========================================
router.get('/quizzes', optionalAuth, getQuizzes);
router.get('/quizzes/stats/me', authenticateJwt, getUserQuizStats);
router.get('/quizzes/code/:code', optionalAuth, getQuizByShareCode);
router.get('/quizzes/:id', optionalAuth, getQuizById);
router.post('/quizzes', authenticateJwt, createQuiz);
router.post('/quizzes/:id/submit', authenticateJwt, submitQuiz);
router.get('/quizzes/:id/leaderboard', getQuizLeaderboard);

// ==========================================
// Global Contests & Competitions (Free & Paid)
// ==========================================
router.get('/contests', optionalAuth, getContests);
router.get('/contests/:id', optionalAuth, getContestById);
router.post('/contests', authenticateJwt, requireAdmin, createContest);
router.post('/contests/:id/join', authenticateJwt, joinContest);
router.post('/contests/:id/submit-round', authenticateJwt, submitContestRound);
router.post('/contests/:id/distribute-prizes', authenticateJwt, requireAdmin, distributePrizes);

// ==========================================
// Points, Subscriptions & Cool Gifts Store
// ==========================================
router.get('/rewards', getRewards);
router.get('/rewards/wallet', authenticateJwt, getMyWallet);
router.post('/rewards/:id/redeem', authenticateJwt, redeemReward);
router.get('/rewards/my-redemptions', authenticateJwt, getMyRedemptions);

export default router;
