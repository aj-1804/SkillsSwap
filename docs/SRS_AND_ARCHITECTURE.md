# SkillSwap Global — Software Requirements Specification & System Architecture
**Project:** SkillSwap Global  
**Tagline:** Learn Together. Share Skills. Grow Globally.  
**Program:** Master of Computer Applications (MCA) Final Year Project  
**Platform Administrator:** Amit Jha (`admin@skillswap.in`)

---

## 1. Project Overview & Problem Statement

In conventional higher education and collegiate environments, acquiring supplementary skills outside the university syllabus (such as modern web frameworks, system design, video editing, or interview rhetoric) typically requires expensive commercial tutoring courses or one-way private lessons. This poses an undue financial burden on students.

Conversely, thousands of students have already acquired proficiency in specific domains and are willing to mentor peers in exchange for reciprocal learning. **SkillSwap Global** introduces a structured, mathematical peer-to-peer barter platform where:
1. Equivalent skills are swapped completely for free.
2. Unequal expertise levels are balanced by calculating a transparent differential fee in Indian Rupees (INR ₹).
3. Students lacking skills to barter can directly book paid learning sessions.

---

## 2. Objectives and Scope

### Key Objectives:
- Democratize skill acquisition through peer reciprocity.
- Provide automated, backend-enforced mathematical exchange valuation.
- Eliminate fraudulent or off-platform payment claims through a verified payment status pipeline.
- Maintain an audit trail of sessions, ratings, and moderation reports for academic administration.

### Scope:
- Multi-role platform supporting Students and Administrators.
- Relational MySQL database schema with foreign key integrity.
- In-app messaging, real-time alert streams, and schedule collision prevention.
- Production-ready fallback relational SQL persistence for container environments.

---

## 3. Functional Requirements (FR)

- **FR-1 Authentication:** Register, authenticate via bcrypt and JWT Bearer tokens, maintain persistent sessions.
- **FR-2 Profile Management:** Maintain biographical information, location, languages, skills offered, skills wanted, and hourly availability.
- **FR-3 Skill Listing Management:** Create, read, update, deactivate, and delete skill listings with Indian Rupee session valuations and duration metadata.
- **FR-4 Rule 1 Equal-Level Exchange:** Propose and confirm 100% free exchanges when session values are equivalent (`diff = 0`).
- **FR-5 Rule 2 Unequal-Level Exchange:** Automatically calculate:
  $$\text{Additional Payment} = \max(0, \text{Higher Session Price} - \text{Lower Session Price})$$
  and enforce settlement via the verified demo payment gateway before session confirmation.
- **FR-6 Rule 3 Direct Paid Learning:** Permit students with zero offered skills to book any mentor's listed price in INR directly.
- **FR-7 Session Management:** Prevent double bookings, assign secure virtual room links, and track completion states.
- **FR-8 Peer Reviews:** Permit 1-5 star reviews strictly upon completed sessions; prevent duplicate submissions.
- **FR-9 In-App Messaging:** Secure student-to-student direct messaging.
- **FR-10 Algorithmic Matching:** Recommend compatible exchange partners based on wants vs. offers with human-readable rationale without external AI reliance.
- **FR-11 Admin Portal:** Dedicated dashboard for Amit Jha to inspect real-time metrics, moderate listings, toggle account suspensions, and audit financial transactions.

---

## 4. Non-Functional Requirements (NFR)

- **Performance:** Response times under 150ms for core catalog queries.
- **Security:** Passwords hashed with 10-round bcrypt salt; parameterized SQL queries to prevent SQL injection; JWT validation on all private routes.
- **Relational Integrity:** Foreign keys with `ON DELETE CASCADE` or `ON DELETE SET NULL` preventing orphan records; numeric monetary values stored strictly using `DECIMAL(10,2)`.
- **Usability:** Responsive layout optimized for desktop, tablet, and mobile with Indian Rupee (₹) formatting.

---

## 5. Software Development Life Cycle (SDLC) Methodology

SkillSwap Global was architected following the **Agile Iterative Waterfall Hybrid Model**:
1. **Requirements & Mathematical Modeling:** Formulation of Barter Rules 1, 2, and 3.
2. **Database Schema Design & Normalization:** 3NF relational normalization across 15 entities.
3. **Backend API Engineering:** Node.js, Express.js controllers, JWT middleware.
4. **Frontend Architecture:** Component modularity in React 19, Tailwind CSS design system.
5. **Integration & Acceptance Verification:** End-to-end execution of student swaps and admin workflows.

---

## 6. System Architecture Diagram

```mermaid
graph TD
    Client[React 19 SPA + Vite + Tailwind CSS]
    Client -->|Axios HTTP / JWT Bearer| Server[Node.js + Express.js API Server]
    
    subgraph Express Backend
        AuthMiddleware[JWT Auth & RBAC Middleware]
        Controllers[Business Logic Controllers]
        ExchangeEngine[Rule 1 & Rule 2 Pricing Engine]
        PaymentGateway[Demo Payment Service Gateway]
    end

    Server --> AuthMiddleware
    AuthMiddleware --> Controllers
    Controllers --> ExchangeEngine
    Controllers --> PaymentGateway

    subgraph Database Layer
        DBManager[Database Manager Layer]
        MySQL[(MySQL 8.0 Database)]
        SqlJs[(Relational SQL Storage Fallback)]
    end

    Controllers --> DBManager
    DBManager -->|mysql2 connection pool| MySQL
    DBManager -->|Automated persistence| SqlJs
```

---

## 7. Data Flow Diagrams (DFD)

### Level 0 DFD (Context Diagram)
```mermaid
graph LR
    Student[Student User] -->|Propose Exchange / Book / Pay| System[SkillSwap Global Platform]
    System -->|Session Link / Match Recommendations| Student
    Admin[Admin: Amit Jha] -->|Moderate / Audit / Suspend| System
    System -->|Real-time Statistics & Audit Logs| Admin
```

### Level 1 DFD (Exchange & Payment Flow)
```mermaid
graph TD
    UserA[Initiator Student] -->|1. Propose Swap with Offered Skill| ExModule[Exchange Controller]
    ListingStore[(Skill Listings Table)] -->|Read Valuations| ExEngine[Differential Pricing Calculator]
    ExEngine -->|Store Calculation: diff in INR| ExStore[(Exchange Requests Table)]
    UserB[Recipient Student] -->|2. Accept Terms| ExModule
    ExModule -->|3. Status: Awaiting Payment| PayModule[Payment Service]
    PayerUser[Payer Student] -->|4. Submit Card / UPI Payment| PayModule
    PayModule -->|5. Verify & Record TXN| PayStore[(Payments Table)]
    PayModule -->|6. Confirm & Schedule Session| SessionStore[(Sessions Table)]
    SessionStore -->|7. Generate Meeting Room| BothUsers[Both Students]
```

---

## 8. Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    USERS ||--o{ SKILL_LISTINGS : owns
    USERS ||--o{ BOOKINGS : "books (student/instructor)"
    USERS ||--o{ EXCHANGE_REQUESTS : "initiates/receives"
    USERS ||--o{ PAYMENTS : executes
    USERS ||--o{ REVIEWS : writes
    USERS ||--o{ NOTIFICATIONS : receives
    CATEGORIES ||--o{ SKILL_LISTINGS : categorizes
    SKILL_LISTINGS ||--o{ BOOKINGS : booked_in
    SKILL_LISTINGS ||--o{ EXCHANGE_REQUESTS : "initiator_listing / recipient_listing"
    BOOKINGS ||--o| SESSIONS : generates
    EXCHANGE_REQUESTS ||--o| SESSIONS : generates
    BOOKINGS ||--o{ PAYMENTS : generates_payment
    EXCHANGE_REQUESTS ||--o{ PAYMENTS : generates_payment
    SESSIONS ||--o{ REVIEWS : reviewed_by

    USERS {
        int id PK
        string name
        string email UK
        string password_hash
        string role
        string status
    }
    SKILL_LISTINGS {
        int id PK
        int user_id FK
        int category_id FK
        string skill_name
        string proficiency_level
        decimal price_inr
        int session_duration_minutes
        boolean is_active
    }
    EXCHANGE_REQUESTS {
        int id PK
        int initiator_id FK
        int recipient_id FK
        int initiator_listing_id FK
        int recipient_listing_id FK
        decimal initiator_session_price
        decimal recipient_session_price
        decimal additional_payment_amount
        int payer_user_id FK
        string status
    }
    BOOKINGS {
        int id PK
        int listing_id FK
        int student_id FK
        int instructor_id FK
        decimal session_price_inr
        string scheduled_at
        string status
    }
    PAYMENTS {
        int id PK
        int user_id FK
        string payment_type
        decimal amount_inr
        string transaction_id UK
        string gateway_status
    }
```
