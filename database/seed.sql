-- ============================================================
-- SkillSwap Global - Seed Data (Realistic Student & Admin Records)
-- Default demo password for all seeded accounts: Password@123
-- Password hash generated using bcrypt (10 rounds):
-- $2b$10$VYfqNpo56cuty6hvRZsfd.a0ghP5GeN5ifAtjybCa0WWwZNJx.hhi
-- ============================================================

USE skillswap_db;

-- 1. Insert Categories
INSERT INTO categories (id, name, slug, description, icon) VALUES
(1, 'Programming & Tech', 'programming-tech', 'Web development, mobile apps, software architecture and programming languages', 'Code'),
(2, 'Design & Creative', 'design-creative', 'UI/UX design, graphic design, 3D modeling, and branding', 'Palette'),
(3, 'Languages & Communication', 'languages-communication', 'Spoken English, regional languages, interview preparation and rhetoric', 'Languages'),
(4, 'Data & Databases', 'data-databases', 'SQL, database design, data analysis, and machine learning basics', 'Database'),
(5, 'Digital Media & Video', 'media-video', 'Video editing, reels creation, color grading, and podcast production', 'Video'),
(6, 'Academic & MCA Core', 'academic-mca', 'Algorithms, computer networks, operating systems, and theory of computation', 'GraduationCap')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 2. Insert Users (Admin Amit Jha + 12 Indian Students)
-- Password for all demo accounts: Password@123
INSERT INTO users (id, name, email, password_hash, role, avatar_url, bio, location, languages, skills_offered, skills_wanted, availability, status) VALUES
(1, 'Amit Jha', 'admin@skillswap.in', '$2b$10$VYfqNpo56cuty6hvRZsfd.a0ghP5GeN5ifAtjybCa0WWwZNJx.hhi', 'admin', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80', 'Platform Administrator & MCA Program Coordinator. Ensuring safe, equitable peer-to-peer student learning exchanges.', 'New Delhi, India', 'English, Hindi', 'System Architecture, MCA Project Guidance', 'None', 'Full-time Admin', 'active'),
(2, 'Brijlal', 'brijlal@skillswap.in', '$2b$10$VYfqNpo56cuty6hvRZsfd.a0ghP5GeN5ifAtjybCa0WWwZNJx.hhi', 'student', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80', 'Final year MCA student passionate about backend systems, Core Java, and relational database fundamentals.', 'Lucknow, Uttar Pradesh', 'Hindi, English', 'Java, SQL Basics', 'JavaScript, React.js', 'Mon-Fri 6:00 PM - 9:00 PM', 'active'),
(3, 'Mohit Verma', 'mohit@skillswap.in', '$2b$10$VYfqNpo56cuty6hvRZsfd.a0ghP5GeN5ifAtjybCa0WWwZNJx.hhi', 'student', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80', 'Frontend developer building single page applications in React and Tailwind CSS. Eager to master backend query tuning.', 'Indore, Madhya Pradesh', 'English, Hindi', 'React.js, Tailwind CSS', 'SQL, Java Backend', 'Sat-Sun 10:00 AM - 4:00 PM', 'active'),
(4, 'Isha Bhati', 'isha@skillswap.in', '$2b$10$VYfqNpo56cuty6hvRZsfd.a0ghP5GeN5ifAtjybCa0WWwZNJx.hhi', 'student', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80', 'UI/UX enthusiast, Figma wizard, and design systems creator. Looking to learn Python for automation.', 'Jaipur, Rajasthan', 'English, Hindi', 'UI/UX Design, Figma', 'Python, Data Analytics', 'Daily 5:00 PM - 8:00 PM', 'active'),
(5, 'Komal Saroj', 'komal@skillswap.in', '$2b$10$VYfqNpo56cuty6hvRZsfd.a0ghP5GeN5ifAtjybCa0WWwZNJx.hhi', 'student', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80', 'Pre-final student learning Python syntax and scripting. Want to make clean interfaces with Figma and UI design.', 'Varanasi, Uttar Pradesh', 'Hindi, English', 'Python, Basic Scripting', 'UI/UX Design, Figma', 'Tue, Thu, Sat 7:00 PM - 10:00 PM', 'active'),
(6, 'Rahul Sharma', 'rahul@skillswap.in', '$2b$10$VYfqNpo56cuty6hvRZsfd.a0ghP5GeN5ifAtjybCa0WWwZNJx.hhi', 'student', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80', 'Database specialist experienced in complex indexing, normalization, transaction isolation, and query optimization.', 'Bengaluru, Karnataka', 'English, Hindi, Kannada', 'SQL, Database Indexing', 'Spoken English, Public Speaking', 'Weekends 9:00 AM - 1:00 PM', 'active'),
(7, 'Priya Singh', 'priya@skillswap.in', '$2b$10$VYfqNpo56cuty6hvRZsfd.a0ghP5GeN5ifAtjybCa0WWwZNJx.hhi', 'student', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80', 'Graphic designer crafting brand identities, vector illustrations, and marketing banners using Adobe Photoshop & Illustrator.', 'Bhopal, Madhya Pradesh', 'English, Hindi', 'Graphic Design, Branding', 'Web Development, HTML/CSS', 'Mon, Wed, Fri 4:00 PM - 7:00 PM', 'active'),
(8, 'Ananya Gupta', 'ananya@skillswap.in', '$2b$10$VYfqNpo56cuty6hvRZsfd.a0ghP5GeN5ifAtjybCa0WWwZNJx.hhi', 'student', 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&auto=format&fit=crop&q=80', 'Certified communications mentor, debate coach, and campus placement interview prep specialist.', 'Pune, Maharashtra', 'English, Hindi, Marathi', 'Spoken English, Interview Prep', 'Data Structures & Algorithms', 'Mon-Sat 7:00 PM - 9:00 PM', 'active'),
(9, 'Arjun Yadav', 'arjun@skillswap.in', '$2b$10$VYfqNpo56cuty6hvRZsfd.a0ghP5GeN5ifAtjybCa0WWwZNJx.hhi', 'student', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80', 'Content creator editing high-engagement Instagram Reels, YouTube shorts, and Premiere Pro timelines.', 'Noida, Uttar Pradesh', 'Hindi, English', 'Video Editing, Reels Editing', 'React.js, Web Design', 'Daily 8:00 PM - 11:00 PM', 'active'),
(10, 'Neha Kumari', 'neha@skillswap.in', '$2b$10$VYfqNpo56cuty6hvRZsfd.a0ghP5GeN5ifAtjybCa0WWwZNJx.hhi', 'student', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80', 'Competitive programmer with 400+ LeetCode problems solved. Specializing in Trees, Graphs, and Dynamic Programming in C++.', 'Patna, Bihar', 'English, Hindi', 'Data Structures, C++ Algorithms', 'Graphic Design, Branding', 'Sat-Sun 2:00 PM - 6:00 PM', 'active'),
(11, 'Rohit Mishra', 'rohit@skillswap.in', '$2b$10$VYfqNpo56cuty6hvRZsfd.a0ghP5GeN5ifAtjybCa0WWwZNJx.hhi', 'student', 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&auto=format&fit=crop&q=80', 'Full stack engineer building REST APIs with Node.js, Express, JWT, and relational databases.', 'Kanpur, Uttar Pradesh', 'English, Hindi', 'Node.js, Express REST APIs', 'Machine Learning, Python', 'Weekdays 7:00 PM - 9:30 PM', 'active'),
(12, 'Sneha Patel', 'sneha@skillswap.in', '$2b$10$VYfqNpo56cuty6hvRZsfd.a0ghP5GeN5ifAtjybCa0WWwZNJx.hhi', 'student', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80', 'Data enthusiast teaching supervised machine learning, Scikit-learn, regression, and model evaluation techniques.', 'Ahmedabad, Gujarat', 'English, Hindi, Gujarati', 'Machine Learning, Scikit-learn', 'SQL Database Tuning', 'Tue, Thu, Sun 6:00 PM - 9:00 PM', 'active'),
(13, 'Aman Verma', 'aman@skillswap.in', '$2b$10$VYfqNpo56cuty6hvRZsfd.a0ghP5GeN5ifAtjybCa0WWwZNJx.hhi', 'student', 'https://images.unsplash.com/photo-1513956589380-bad6acb9b9d4?w=200&auto=format&fit=crop&q=80', 'Cyber security club lead covering OWASP Top 10 web vulnerabilities, Burp Suite, and penetration testing basics.', 'Chandigarh, India', 'English, Hindi, Punjabi', 'Cyber Security, Ethical Hacking', 'Spoken English, Public Speaking', 'Weekends 11:00 AM - 3:00 PM', 'active')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 3. Insert Skill Listings
INSERT INTO skill_listings (id, user_id, category_id, title, skill_name, description, proficiency_level, session_duration_minutes, price_inr, teaching_availability, supporting_link, is_active, rating_avg, total_reviews) VALUES
(1, 2, 1, 'Core Java OOP & Fundamentals for Beginners', 'Java', 'Master Object-Oriented Programming, classes, inheritance, polymorphism, and basic collection frameworks with hands-on coding exercises.', 'Beginner', 60, 300.00, 'Mon, Wed, Fri 6:00 PM - 8:00 PM', 'https://github.com/demo/java-basics', 1, 4.80, 5),
(2, 2, 4, 'Basic SQL Queries & Relational Concepts', 'SQL', 'Learn SELECT queries, WHERE clauses, GROUP BY, aggregates, and simple JOINs to query data effectively.', 'Beginner', 60, 300.00, 'Tue, Thu 7:00 PM - 9:00 PM', 'https://github.com/demo/sql-basics', 1, 4.70, 3),
(3, 3, 1, 'Modern React.js: Components, State & Hooks', 'React.js', 'Step-by-step guidance on React 18/19, useState, useEffect, custom hooks, and Tailwind CSS component architecture.', 'Intermediate', 60, 400.00, 'Sat-Sun 10:00 AM - 1:00 PM', 'https://github.com/demo/react-showcase', 1, 4.90, 8),
(4, 4, 2, 'Figma UI/UX Design & Design Systems Workshop', 'UI/UX Design', 'Learn Figma auto-layout, interactive prototyping, color contrast, typographic hierarchy, and micro-interactions.', 'Intermediate', 60, 500.00, 'Daily 6:00 PM - 8:00 PM', 'https://behance.net/demo-portfolio', 1, 5.00, 11),
(5, 5, 1, 'Python Programming & Scripting for Novices', 'Python', 'Gentle introduction to Python syntax, loops, functions, data structures (lists/dictionaries), and file handling.', 'Beginner', 60, 300.00, 'Tue, Thu, Sat 7:00 PM - 9:00 PM', 'https://github.com/demo/python-starter', 1, 4.60, 4),
(6, 6, 4, 'Advanced SQL Optimization, Indexing & Transactions', 'SQL', 'Deep dive into EXPLAIN query plans, B-Tree indexes, composite keys, locking mechanisms, and ACID transaction isolation.', 'Advanced', 75, 600.00, 'Weekends 9:00 AM - 12:00 PM', 'https://github.com/demo/advanced-db', 1, 4.95, 14),
(7, 7, 2, 'Graphic Design, Vector Logos & Social Brand Kits', 'Graphic Design', 'Learn Adobe Illustrator/Photoshop tools to craft compelling student club logos, posters, and digital identity packs.', 'Intermediate', 60, 450.00, 'Mon, Wed, Fri 4:00 PM - 6:00 PM', 'https://dribbble.com/demo-graphic', 1, 4.85, 7),
(8, 8, 3, 'Spoken English, Fluency & Tech Interview Mastery', 'Spoken English', 'Overcome hesitation in technical interviews and group discussions. Improve pronunciation, vocabulary, and active speech flow.', 'Advanced', 60, 500.00, 'Mon-Sat 7:00 PM - 9:00 PM', 'https://linkedin.com/in/demo-mentor', 1, 4.98, 19),
(9, 9, 5, 'Short-form Video Editing (Premiere Pro & CapCut)', 'Video Editing', 'Master viral pacing, keyframing, motion graphics, audio ducking, and color presets for Instagram Reels and YouTube shorts.', 'Beginner', 60, 300.00, 'Daily 8:00 PM - 10:00 PM', 'https://youtube.com/@demo-creator', 1, 4.65, 6),
(10, 10, 6, 'Data Structures & Algorithms: Trees & Dynamic Prog', 'DSA in C++', 'Ace technical interviews! Master binary tree traversals, graphs, memoization, and dynamic programming patterns.', 'Intermediate', 75, 400.00, 'Sat-Sun 2:00 PM - 5:00 PM', 'https://leetcode.com/demo_profile', 1, 4.90, 12),
(11, 11, 1, 'REST API Development with Node.js & Express', 'Node.js', 'Build secure backends: routing, middleware, JWT verification, input validation, and database pooling.', 'Intermediate', 60, 450.00, 'Weekdays 7:00 PM - 9:00 PM', 'https://github.com/demo/express-apis', 1, 4.80, 9),
(12, 12, 4, 'Practical Machine Learning with Python & Scikit', 'Machine Learning', 'Train classification and regression models, feature engineering, cross-validation, and performance metrics.', 'Intermediate', 60, 550.00, 'Tue, Thu 6:30 PM - 8:30 PM', 'https://kaggle.com/demo_learner', 1, 4.75, 5),
(13, 13, 1, 'Ethical Hacking 101 & Web App Penetration Testing', 'Cyber Security', 'Understand SQL injection, XSS, CSRF, network reconnaissance, and practical defense strategies.', 'Intermediate', 60, 500.00, 'Weekends 11:00 AM - 2:00 PM', 'https://github.com/demo/sec-notes', 1, 4.88, 8)
ON DUPLICATE KEY UPDATE title=VALUES(title);

-- 4. Sample Exchange Requests Demonstrating Core Rules
-- Rule 1: Equal-Level Exchange (Brijlal SQL @ ₹300 <-> Mohit Java/React Basics @ ₹300) -> Diff ₹0!
INSERT INTO exchange_requests (id, initiator_id, recipient_id, initiator_listing_id, recipient_listing_id, initiator_session_price, recipient_session_price, additional_payment_amount, payer_user_id, proposed_date, notes, status) VALUES
(1, 2, 3, 2, 3, 300.00, 300.00, 0.00, NULL, 'Next Saturday, 4:00 PM', 'Hey Mohit! I can teach you SQL queries and would love to exchange for your React basics session. Equal level swap!', 'confirmed'),

-- Rule 2: Unequal-Level Exchange (Komal Python @ ₹300 <-> Isha UI/UX @ ₹500) -> Diff ₹200 (Komal pays ₹200)!
(2, 5, 4, 5, 4, 300.00, 500.00, 200.00, 5, 'Upcoming Thursday, 7:00 PM', 'Hi Isha, I want to learn Figma UI design from you. I offer beginner Python. Since your session is ₹500 and mine is ₹300, I will pay the ₹200 difference via SkillSwap.', 'accepted'),

-- Pending exchange proposal for demonstration
(3, 9, 7, 9, 7, 300.00, 450.00, 150.00, 9, 'Coming Monday, 6:00 PM', 'Hi Priya, I can offer video editing tips in exchange for your graphic design session. Ready to cover the ₹150 difference!', 'pending')
ON DUPLICATE KEY UPDATE status=VALUES(status);

-- 5. Exchange Request Skills
INSERT INTO exchange_request_skills (id, exchange_id, skill_name, proficiency_level, role_type) VALUES
(1, 1, 'SQL', 'Beginner', 'initiator_offer'),
(2, 1, 'React.js', 'Beginner', 'recipient_offer'),
(3, 2, 'Python', 'Beginner', 'initiator_offer'),
(4, 2, 'UI/UX Design', 'Intermediate', 'recipient_offer'),
(5, 3, 'Video Editing', 'Beginner', 'initiator_offer'),
(6, 3, 'Graphic Design', 'Intermediate', 'recipient_offer')
ON DUPLICATE KEY UPDATE skill_name=VALUES(skill_name);

-- 6. Sample Bookings (Rule 3: Direct Paid Learning for Students Without Skill to Offer)
INSERT INTO bookings (id, listing_id, student_id, instructor_id, session_price_inr, scheduled_at, duration_minutes, student_notes, status) VALUES
(1, 3, 2, 3, 400.00, '2026-10-25 10:00 AM', 60, 'Direct booking to learn React component lifecycle and hooks.', 'confirmed'),
(2, 8, 6, 8, 500.00, '2026-10-28 07:00 PM', 60, 'Rahul booked Ananya for tech campus placement communication prep.', 'confirmed'),
(3, 6, 5, 6, 600.00, '2026-11-02 11:00 AM', 75, 'Komal booked Rahul for advanced SQL indexing fundamentals.', 'awaiting_payment')
ON DUPLICATE KEY UPDATE status=VALUES(status);

-- 7. Payments Audit Trail
INSERT INTO payments (id, user_id, booking_id, exchange_id, payment_type, amount_inr, payment_method, transaction_id, gateway_status) VALUES
(1, 2, 1, NULL, 'booking', 400.00, 'upi', 'SSG-TXN-20261018-001', 'success'),
(2, 6, 2, NULL, 'booking', 500.00, 'card', 'SSG-TXN-20261018-002', 'success'),
(3, 5, NULL, 2, 'exchange_difference', 200.00, 'upi', 'SSG-TXN-20261018-003', 'success')
ON DUPLICATE KEY UPDATE transaction_id=VALUES(transaction_id);

-- 8. Learning Sessions
INSERT INTO sessions (id, booking_id, exchange_id, instructor_id, student_id, scheduled_at, duration_minutes, meeting_link, status) VALUES
(1, 1, NULL, 3, 2, '2026-10-25 10:00 AM', 60, 'https://meet.skillswap.in/room-mohit-brijlal-react', 'completed'),
(2, NULL, 1, 2, 3, 'Next Saturday, 4:00 PM', 60, 'https://meet.skillswap.in/room-swap-brijlal-mohit', 'scheduled'),
(3, 2, NULL, 8, 6, '2026-10-28 07:00 PM', 60, 'https://meet.skillswap.in/room-ananya-rahul-comm', 'scheduled')
ON DUPLICATE KEY UPDATE status=VALUES(status);

-- 9. Reviews
INSERT INTO reviews (id, session_id, listing_id, reviewer_id, reviewee_id, rating, comment) VALUES
(1, 1, 3, 2, 3, 5, 'Mohit is a phenomenal instructor! He explained React state and custom hooks so clearly with real examples.'),
(2, NULL, 4, 5, 4, 5, 'Isha showed me how to structure Figma components and wireframes step-by-step. Worth every rupee!'),
(3, NULL, 6, 2, 6, 5, 'Rahul demystified database execution plans and B-Tree indexing. Outstanding session!'),
(4, NULL, 8, 6, 5, 5, 'Ananya gave actionable feedback on my pitch and interview responses. Feel much more confident now.')
ON DUPLICATE KEY UPDATE rating=VALUES(rating);

-- 10. Conversations & Messages
INSERT INTO conversations (id, participant1_id, participant2_id) VALUES
(1, 2, 3),
(2, 4, 5)
ON DUPLICATE KEY UPDATE id=VALUES(id);

INSERT INTO messages (id, conversation_id, sender_id, receiver_id, content, is_read) VALUES
(1, 1, 2, 3, 'Hi Mohit! Are you free this weekend for our SQL <-> React swap session?', 1),
(2, 1, 3, 2, 'Hey Brijlal! Yes, Saturday 4:00 PM works perfectly. Looking forward to it!', 1),
(3, 2, 5, 4, 'Hi Isha, I saw your Figma listing and submitted an exchange request with the ₹200 fee difference.', 1),
(4, 2, 4, 5, 'Great Komal! I just accepted it. See you on Thursday at 7:00 PM!', 1)
ON DUPLICATE KEY UPDATE content=VALUES(content);

-- 11. Notifications
INSERT INTO notifications (id, user_id, type, title, message, link, is_read) VALUES
(1, 3, 'exchange_request', 'New Skill Exchange Request', 'Brijlal has proposed an equal-value skill swap for your React.js listing.', '/exchanges', 1),
(2, 4, 'exchange_request', 'Unequal Exchange Proposal', 'Komal Saroj proposed an exchange for your UI/UX listing with ₹200 differential payment.', '/exchanges', 1),
(3, 2, 'booking_confirmed', 'Session Booking Confirmed', 'Your booking with Mohit Verma for React.js is confirmed. Meeting link generated.', '/bookings', 0),
(4, 5, 'exchange_accepted', 'Exchange Accepted', 'Isha Bhati accepted your skill exchange proposal for Figma UI/UX.', '/exchanges', 0)
ON DUPLICATE KEY UPDATE title=VALUES(title);

-- 12. Reports (For Admin Moderation Demo)
INSERT INTO reports (id, reporter_id, reported_user_id, listing_id, reason, status, admin_notes) VALUES
(1, 2, 9, 9, 'Listing description mentions off-platform payment method instead of SkillSwap safe gateway.', 'pending', NULL)
ON DUPLICATE KEY UPDATE reason=VALUES(reason);
