# SkillSwap Global — Platform for Sharing Skills Globally

**Tagline:** Learn Together. Share Skills. Grow Globally.  
**Project Category:** Master of Computer Applications (MCA) Final Year Full-Stack Project  
**Platform Administrator:** Amit Jha (`admin@skillswap.in`)

---

## 1. Overview & Vision

**SkillSwap Global** is an end-to-end web platform connecting students who want to learn new skills with students who can teach them. Rather than forcing expensive tutoring subscriptions, the platform encourages equitable peer barter:
- **Rule 1 (Equal-Level Exchange):** When two students offer skills of equivalent value or proficiency, they exchange sessions with **zero payment** (100% free swap).
- **Rule 2 (Unequal-Level Exchange):** If one student offers a higher level of expertise than the other offers in return, the less-skilled peer pays the backend-calculated monetary difference in Indian Rupees (₹).
  $$\text{Additional Payment} = \max(0, \text{Higher Session Price} - \text{Lower Session Price})$$
- **Rule 3 (Direct Paid Learning):** Students without any skill to barter can directly book and pay the mentor's listed price in INR.

---

## 2. Technology Stack

- **Frontend:** React 19, TypeScript, React Router v7, Axios, Tailwind CSS, Lucide React icons.
- **Backend:** Node.js, Express.js REST APIs, JWT authentication, bcrypt password hashing, input validation.
- **Database:** MySQL 8.0 relational database with `mysql2/promise` driver, 3NF schema, foreign key constraints, transactions, and automated embedded relational SQL persistence fallback.
- **Currency:** Indian Rupee (INR ₹) formatted consistently throughout.

---

## 3. Demo Accounts & Personas

Default password for all seeded accounts: **`Password@123`**

| Role | Name | Email | Skills & Notes |
| :--- | :--- | :--- | :--- |
| **Super Admin** | **Amit Jha** | `admin@skillswap.in` | Dedicated dashboard, user status suspension, audit logs |
| **Student** | **Brijlal** | `brijlal@skillswap.in` | Core Java OOP, SQL Basics (Teaches SQL @ ₹300) |
| **Student** | **Mohit Verma** | `mohit@skillswap.in` | React.js, Tailwind CSS (Teaches React @ ₹400) |
| **Student** | **Isha Bhati** | `isha@skillswap.in` | UI/UX Design & Figma (Teaches UI/UX @ ₹500) |
| **Student** | **Komal Saroj** | `komal@skillswap.in` | Python Programming & Scripting (Teaches Python @ ₹300) |
| **Student** | **Rahul Sharma** | `rahul@skillswap.in` | Advanced SQL Optimization & Indexing (Teaches @ ₹600) |
| **Student** | **Priya Singh** | `priya@skillswap.in` | Graphic Design & Branding (Teaches @ ₹450) |
| **Student** | **Ananya Gupta** | `ananya@skillswap.in` | Spoken English & Placement Prep (Teaches @ ₹500) |
| **Student** | **Arjun Yadav** | `arjun@skillswap.in` | Short-form Video Editing (Teaches @ ₹300) |
| **Student** | **Neha Kumari** | `neha@skillswap.in` | DSA in C++ Trees & DP (Teaches @ ₹400) |
| **Student** | **Rohit Mishra** | `rohit@skillswap.in` | Node.js & Express REST APIs (Teaches @ ₹450) |
| **Student** | **Sneha Patel** | `sneha@skillswap.in` | Machine Learning with Python (Teaches @ ₹550) |
| **Student** | **Aman Verma** | `aman@skillswap.in` | Cyber Security & Ethical Hacking (Teaches @ ₹500) |

---

## 4. Quick Start & Local Execution

### Step 1: Clone and Install Dependencies
```bash
git clone https://github.com/your-username/skillswap-global.git
cd skillswap-global
npm install
```

### Step 2: Configure Environment (`.env`)
```bash
cp .env.example .env
```
Update MySQL credentials if connecting to an external MySQL server, or leave defaults to let the built-in relational SQL engine initialize tables and seeds automatically!

### Step 3: Run the Application
```bash
npm run dev
```
Open **`http://localhost:3000`** in your browser.

---

## 5. Project Deliverables in `docs/`

- `docs/SRS_AND_ARCHITECTURE.md`: Complete Software Requirements Specification, SDLC methodology, System Architecture, DFD Level 0 & 1, and Entity Relationship Diagram (ERD).
- `docs/API_DOCUMENTATION.md`: Complete REST API contracts with endpoints, parameters, and JSON payloads.
- `docs/TEST_CASES.md`: Quality assurance test cases with expected and actual results.
- `docs/SETUP_GUIDE_WINDOWS.md`: Detailed Windows local setup instructions for MySQL and Node.js.
- `database/schema.sql`: Full MySQL relational schema with foreign keys and constraints.
- `database/seed.sql`: Realistic seed data with Amit Jha and 12 Indian students.

---

## 6. Completed Features Checklist

- [x] Full-Stack Node.js Express & React 19 architecture running on port 3000.
- [x] Normalized relational MySQL database schema and seed script.
- [x] JWT authentication and bcrypt password hashing.
- [x] Rule 1: Equal-level free skill exchange with ₹0 fee.
- [x] Rule 2: Unequal-level exchange with backend-calculated difference in INR.
- [x] Rule 3: Direct paid learning for students without skills to offer.
- [x] Interactive Demo Payment Gateway (UPI, Card, NetBanking) with success & failure simulation.
- [x] Algorithmic matching & recommendation engine with human-readable rationale.
- [x] In-app student-to-student messaging.
- [x] Student Reviews & Ratings with duplicate prevention.
- [x] Administrator Dashboard for **Amit Jha** with real-time database metrics and user moderation.
- [x] Floating 1-click Demo Account Switcher for rapid college presentation testing.
