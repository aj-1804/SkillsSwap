# SkillSwap Global — Complete REST API Documentation
Base URL: `http://localhost:3000/api`

All protected endpoints require an `Authorization: Bearer <JWT_TOKEN>` header.

---

## 1. Authentication & User Endpoints

### `POST /api/auth/register`
Creates a new student account.
- **Request Body:**
  ```json
  {
    "name": "Arjun Yadav",
    "email": "arjun@example.com",
    "password": "Password@123",
    "location": "Noida, India",
    "languages": "Hindi, English",
    "skills_offered": "Video Editing",
    "skills_wanted": "React.js",
    "availability": "Daily 8:00 PM - 10:00 PM"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "success": true,
    "message": "Account registered successfully.",
    "token": "eyJhbGciOi...",
    "user": { "id": 14, "name": "Arjun Yadav", "email": "arjun@example.com", "role": "student" }
  }
  ```

### `POST /api/auth/login`
Authenticates a student or administrator.
- **Request Body:**
  ```json
  {
    "email": "admin@skillswap.in",
    "password": "Password@123"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "token": "eyJhbGci...",
    "user": { "id": 1, "name": "Amit Jha", "email": "admin@skillswap.in", "role": "admin" }
  }
  ```

### `GET /api/auth/me`
Retrieves current authenticated profile, unread notification counts, and pending exchange count.
- **Headers:** `Authorization: Bearer <TOKEN>`

---

## 2. Skill Listings Endpoints

### `GET /api/listings`
Search and filter skill catalog.
- **Query Parameters:**
  - `search` (e.g. `React`, `Python`)
  - `category` (slug or ID)
  - `proficiency` (`Beginner`, `Intermediate`, `Advanced`)
  - `min_price`, `max_price` (in INR)
  - `sort` (`newest`, `rating_desc`, `price_asc`, `price_desc`)
  - `page`, `limit`

### `POST /api/listings` [Protected]
Publish a new skill listing to teach.
- **Request Body:**
  ```json
  {
    "title": "Mastering Core Java OOP & Data Structures",
    "skill_name": "Java",
    "category_id": 1,
    "proficiency_level": "Intermediate",
    "session_duration_minutes": 60,
    "price_inr": 350.00,
    "teaching_availability": "Mon-Wed-Fri 7:00 PM",
    "description": "Comprehensive hands-on breakdown of classes, polymorphism, and Java collections."
  }
  ```

---

## 3. Core Skill Exchange Endpoints (Rule 1 & Rule 2)

### `POST /api/exchanges` [Protected]
Submit a skill barter proposal. Backend automatically evaluates whether Rule 1 (equal) or Rule 2 (unequal) applies.
- **Request Body:**
  ```json
  {
    "recipient_id": 4,
    "initiator_listing_id": 5,
    "recipient_listing_id": 4,
    "proposed_date": "Next Saturday, 4:00 PM",
    "notes": "Let's exchange Python for Figma UI/UX."
  }
  ```
- **Calculation Output:**
  ```json
  {
    "success": true,
    "exchangeId": 4,
    "calculation": {
      "additionalPayment": 200.00,
      "payerUserId": 5,
      "isEqual": false,
      "priceDifference": 200.00
    }
  }
  ```

### `PATCH /api/exchanges/:id/accept` [Protected]
Recipient accepts proposal.
- If additional payment = 0, status moves to `confirmed` and classroom room link is generated.
- If additional payment > 0, status moves to `awaiting_payment`.

### `POST /api/exchanges/:id/confirm` [Protected]
Completes exchange after differential payment is verified.

---

## 4. Direct Paid Learning Endpoints (Rule 3)

### `POST /api/bookings` [Protected]
Directly books any mentor's listed session. Does not require the student to offer any skill.
- **Request Body:**
  ```json
  {
    "listing_id": 3,
    "scheduled_at": "2026-10-25 10:00 AM",
    "duration_minutes": 60,
    "student_notes": "Want to clarify React state management."
  }
  ```

---

## 5. Payments & Demo Gateway

### `POST /api/payments/verify` [Protected]
Simulates payment authorization and updates corresponding booking or exchange status to `confirmed`.
- **Request Body:**
  ```json
  {
    "type": "booking",
    "reference_id": 1,
    "payment_method": "upi",
    "simulate_failure": false
  }
  ```

---

## 6. Recommendations & Admin Endpoints

- `GET /api/recommendations` - Computes skill matches and returns human-readable matching justification.
- `GET /api/admin/stats` - Compiles real-time metrics for Amit Jha.
- `PATCH /api/admin/users/:id/status` - Suspend or activate user accounts.
- `GET /api/admin/reports` & `PATCH /api/admin/reports/:id/resolve` - Content moderation.
