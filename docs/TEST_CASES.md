# SkillSwap Global — Testing Strategy & Comprehensive Test Cases

## 1. Testing Strategy

The quality assurance for **SkillSwap Global** employs a multi-tiered verification strategy:
1. **Unit & Calculation Testing:** Validating the core mathematical exchange formula $\max(0, P_A - P_B)$ across equivalent, lower, and higher valuation permutations.
2. **Integration Testing:** Testing status state transitions between Express endpoints and the relational database transactions.
3. **Security Testing:** Verifying JWT expiration, unauthorized access to foreign listings, and admin route authorization.
4. **End-to-End User Flow Testing:** Executing complete scenarios from account registration to review creation.

---

## 2. Test Cases Table (Expected vs. Actual Results)

| Test ID | Module | Scenario / Input | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-01** | Auth | Register student with duplicate email address (`brijlal@skillswap.in`) | HTTP 400 Bad Request; error message "An account with this email address already exists." | Correctly rejected with 400 status code and informative error message. | **PASSED** |
| **TC-02** | Auth | Login with incorrect password | HTTP 401 Unauthorized; password hash never leaked in error response. | Returned HTTP 401; password hash concealed. | **PASSED** |
| **TC-03** | Auth | Password hashing verification | Passwords hashed using bcrypt salt rounds $\ge 10$; plain text never stored. | Verified bcrypt hash format `$2a$10$...` in database. | **PASSED** |
| **TC-04** | Exchange | **Rule 1: Equal-Value Swap** (Brijlal SQL @ ₹300 $\leftrightarrow$ Mohit React @ ₹300) | `additional_payment_amount` = `0.00`; `payer_user_id` = `null`; status auto-transitions to `confirmed`. | Diff calculated as ₹0.00; zero fee required; session scheduled immediately. | **PASSED** |
| **TC-05** | Exchange | **Rule 2: Unequal-Value Swap** (Komal Python @ ₹300 $\leftrightarrow$ Isha UI/UX @ ₹500) | Differential fee = ₹200.00; designated payer is Komal (`payer_user_id` = 5); status is `awaiting_payment`. | Calculated exact ₹200 difference; designated Komal as payer; status set to `awaiting_payment`. | **PASSED** |
| **TC-06** | Exchange | Exchange proposal with self (Student A $\rightarrow$ Student A) | HTTP 400 Bad Request; message "You cannot propose a skill swap with yourself." | Prohibited with HTTP 400 validation response. | **PASSED** |
| **TC-07** | Booking | **Rule 3: Direct Paid Booking** (Student with zero listings books Mohit Verma @ ₹400) | Booking created with status `awaiting_payment`; user not forced to list any skill. | Booking successfully recorded in database without requiring user skill. | **PASSED** |
| **TC-08** | Payment | Demo Gateway payment submission with UPI ID | Transaction recorded in `payments` table with unique transaction ID; status updated to `confirmed`. | Payment verified; transaction ID `SSG-TXN-...` generated; session room created. | **PASSED** |
| **TC-09** | Payment | Demo Gateway with "Simulate Bank Failure" checked | HTTP 400; status remains unconfirmed; error notification presented to user. | Simulated failure triggered; transaction declined without status advancement. | **PASSED** |
| **TC-10** | Security | Non-admin user attempts access to `GET /api/admin/stats` | HTTP 403 Forbidden; "Access denied. Administrator privileges required." | Non-admin blocked; access restricted strictly to Amit Jha (`role = 'admin'`). | **PASSED** |
| **TC-11** | Listings | Student attempts editing a listing owned by another student | HTTP 403 Forbidden; permission denied. | Ownership validation triggered; unauthorized modification prevented. | **PASSED** |
| **TC-12** | Review | Duplicate review submission for the same completed session | HTTP 400; "You have already submitted a review for this skill." | Duplicate prevented via database uniqueness check. | **PASSED** |
| **TC-13** | Review | Review score range verification (Rating < 1 or > 5) | Clamped or rejected; rating stored strictly between 1 and 5. | Rating clamped between 1 and 5; listing average recalculated accurately. | **PASSED** |
| **TC-14** | Admin | Admin suspends user account; user attempts login | Status updated to `suspended`; login rejected with HTTP 403 account suspended message. | Account suspended; subsequent logins blocked until administrator reinstates. | **PASSED** |
| **TC-15** | Matching | Recommendation engine compatibility query | Generates explanation: "Recommended because Brijlal wants to learn JavaScript and can offer SQL at a similar level." | Recommendation score computed with clear textual explanation. | **PASSED** |
| **TC-16** | Messaging | Student sends private message to mentor | Message persisted in MySQL/SQL database; only accessible to conversation participants. | Message inserted; conversation timestamp updated; private to participants. | **PASSED** |
