-- ============================================================
-- SkillSwap Global - Database Schema (MySQL 8.0+)
-- Relational Schema with Foreign Keys, Constraints, and Indexes
-- ============================================================

CREATE DATABASE IF NOT EXISTS skillswap_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE skillswap_db;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(180) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('student', 'admin') NOT NULL DEFAULT 'student',
  avatar_url VARCHAR(500) NULL,
  bio TEXT NULL,
  location VARCHAR(120) DEFAULT 'India',
  languages VARCHAR(255) DEFAULT 'English, Hindi',
  skills_offered TEXT NULL,
  skills_wanted TEXT NULL,
  availability VARCHAR(255) DEFAULT 'Flexible / Weekday Evenings & Weekends',
  status ENUM('active', 'suspended') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_email (email),
  INDEX idx_users_role (role),
  INDEX idx_users_status (status)
) ENGINE=InnoDB;

-- 2. Categories Table
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(80) NOT NULL UNIQUE,
  slug VARCHAR(80) NOT NULL UNIQUE,
  description VARCHAR(255) NULL,
  icon VARCHAR(60) DEFAULT 'BookOpen',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 3. Skills Table (Taxonomy)
CREATE TABLE IF NOT EXISTS skills (
  id INT AUTO_INCREMENT PRIMARY KEY,
  category_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  description VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
  INDEX idx_skills_category (category_id)
) ENGINE=InnoDB;

-- 4. User Skills Table
CREATE TABLE IF NOT EXISTS user_skills (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  skill_name VARCHAR(100) NOT NULL,
  type ENUM('offer', 'want') NOT NULL,
  proficiency_level ENUM('Beginner', 'Intermediate', 'Advanced') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_skills_user (user_id)
) ENGINE=InnoDB;

-- 5. Skill Listings Table
CREATE TABLE IF NOT EXISTS skill_listings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  category_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  skill_name VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  proficiency_level ENUM('Beginner', 'Intermediate', 'Advanced') NOT NULL,
  session_duration_minutes INT NOT NULL DEFAULT 60,
  price_inr DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  teaching_availability VARCHAR(255) NOT NULL,
  supporting_link VARCHAR(500) NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  rating_avg DECIMAL(3,2) NOT NULL DEFAULT 5.00,
  total_reviews INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
  INDEX idx_listings_user (user_id),
  INDEX idx_listings_category (category_id),
  INDEX idx_listings_skill (skill_name),
  INDEX idx_listings_price (price_inr),
  INDEX idx_listings_active (is_active)
) ENGINE=InnoDB;

-- 6. Exchange Requests Table
CREATE TABLE IF NOT EXISTS exchange_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  initiator_id INT NOT NULL,
  recipient_id INT NOT NULL,
  initiator_listing_id INT NOT NULL,
  recipient_listing_id INT NOT NULL,
  initiator_session_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  recipient_session_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  additional_payment_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  payer_user_id INT NULL,
  proposed_date VARCHAR(100) NULL,
  notes TEXT NULL,
  status ENUM('pending', 'accepted', 'rejected', 'awaiting_payment', 'confirmed', 'in_progress', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (initiator_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (initiator_listing_id) REFERENCES skill_listings(id) ON DELETE CASCADE,
  FOREIGN KEY (recipient_listing_id) REFERENCES skill_listings(id) ON DELETE CASCADE,
  FOREIGN KEY (payer_user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_exchanges_initiator (initiator_id),
  INDEX idx_exchanges_recipient (recipient_id),
  INDEX idx_exchanges_status (status)
) ENGINE=InnoDB;

-- 7. Exchange Request Skills Table
CREATE TABLE IF NOT EXISTS exchange_request_skills (
  id INT AUTO_INCREMENT PRIMARY KEY,
  exchange_id INT NOT NULL,
  skill_name VARCHAR(100) NOT NULL,
  proficiency_level ENUM('Beginner', 'Intermediate', 'Advanced') NOT NULL,
  role_type ENUM('initiator_offer', 'recipient_offer') NOT NULL,
  FOREIGN KEY (exchange_id) REFERENCES exchange_requests(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 8. Direct Paid Bookings Table
CREATE TABLE IF NOT EXISTS bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  listing_id INT NOT NULL,
  student_id INT NOT NULL,
  instructor_id INT NOT NULL,
  session_price_inr DECIMAL(10,2) NOT NULL,
  scheduled_at VARCHAR(100) NOT NULL,
  duration_minutes INT NOT NULL DEFAULT 60,
  student_notes TEXT NULL,
  status ENUM('pending', 'awaiting_payment', 'confirmed', 'in_progress', 'completed', 'cancelled') NOT NULL DEFAULT 'awaiting_payment',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (listing_id) REFERENCES skill_listings(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (instructor_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_bookings_student (student_id),
  INDEX idx_bookings_instructor (instructor_id),
  INDEX idx_bookings_status (status)
) ENGINE=InnoDB;

-- 9. Payments Audit Table
CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  booking_id INT NULL,
  exchange_id INT NULL,
  payment_type ENUM('booking', 'exchange_difference') NOT NULL,
  amount_inr DECIMAL(10,2) NOT NULL,
  payment_method ENUM('upi', 'card', 'netbanking', 'demo_gateway') NOT NULL DEFAULT 'demo_gateway',
  transaction_id VARCHAR(100) NOT NULL UNIQUE,
  gateway_status ENUM('success', 'failed', 'pending') NOT NULL DEFAULT 'success',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL,
  FOREIGN KEY (exchange_id) REFERENCES exchange_requests(id) ON DELETE SET NULL,
  INDEX idx_payments_user (user_id),
  INDEX idx_payments_status (gateway_status)
) ENGINE=InnoDB;

-- 10. Learning Sessions Table
CREATE TABLE IF NOT EXISTS sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT NULL,
  exchange_id INT NULL,
  instructor_id INT NOT NULL,
  student_id INT NOT NULL,
  scheduled_at VARCHAR(100) NOT NULL,
  duration_minutes INT NOT NULL DEFAULT 60,
  meeting_link VARCHAR(500) NULL,
  status ENUM('scheduled', 'in_progress', 'completed', 'cancelled') NOT NULL DEFAULT 'scheduled',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  FOREIGN KEY (exchange_id) REFERENCES exchange_requests(id) ON DELETE CASCADE,
  FOREIGN KEY (instructor_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 11. Reviews Table
CREATE TABLE IF NOT EXISTS reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id INT NULL,
  listing_id INT NOT NULL,
  reviewer_id INT NOT NULL,
  reviewee_id INT NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (listing_id) REFERENCES skill_listings(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewee_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_reviews_listing (listing_id),
  INDEX idx_reviews_reviewee (reviewee_id)
) ENGINE=InnoDB;

-- 12. Conversations Table
CREATE TABLE IF NOT EXISTS conversations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  participant1_id INT NOT NULL,
  participant2_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (participant1_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (participant2_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_participants (participant1_id, participant2_id)
) ENGINE=InnoDB;

-- 13. Messages Table
CREATE TABLE IF NOT EXISTS messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  conversation_id INT NOT NULL,
  sender_id INT NOT NULL,
  receiver_id INT NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_messages_conversation (conversation_id)
) ENGINE=InnoDB;

-- 14. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(150) NOT NULL,
  message TEXT NOT NULL,
  link VARCHAR(255) NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_notifications_user (user_id)
) ENGINE=InnoDB;

-- 15. Reports Table
CREATE TABLE IF NOT EXISTS reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  reporter_id INT NOT NULL,
  reported_user_id INT NULL,
  listing_id INT NULL,
  reason VARCHAR(255) NOT NULL,
  status ENUM('pending', 'reviewed', 'dismissed', 'action_taken') NOT NULL DEFAULT 'pending',
  admin_notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reported_user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (listing_id) REFERENCES skill_listings(id) ON DELETE SET NULL,
  INDEX idx_reports_status (status)
) ENGINE=InnoDB;
