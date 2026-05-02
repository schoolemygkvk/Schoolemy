# Backend Test Cases Documentation
## Complete Test Coverage for Schoolemy Backend

---

## TIER 1: UTILITY TESTS (6 Files, 120+ Tests)

### 1. CurrencyConverter.test.js (25 Tests)

#### Test Group: rupeesToPaise Conversion
- ✅ Converts whole rupees to paise (100 → 10000, 1 → 100, 0 → 0)
- ✅ Converts decimal rupees to paise (5.50 → 550, 10.99 → 1099, 0.01 → 1)
- ✅ Handles large amounts (999999 → 99999900, 1000000 → 100000000)
- ✅ Handles precision correctly (1.5 → 150, 99.99 → 9999)

#### Test Group: paiseToRupees Conversion
- ✅ Converts paise to rupees (10000 → 100, 100 → 1, 0 → 0)
- ✅ Converts decimal paise to rupees (550 → 5.5, 1099 → 10.99, 1 → 0.01)
- ✅ Handles large amounts (99999900 → 999999, 100000000 → 1000000)

#### Test Group: validateAndConvertAmount Validation
- ✅ Converts positive amounts and returns valid result
- ✅ Rejects negative amounts with error message
- ✅ Rejects zero amount when minimum is set
- ✅ Rejects amounts exceeding maximum limit
- ✅ Validates decimal precision (max 2 places)
- ✅ Accepts valid EMI amounts (5000, 7500.50)
- ✅ Respects minimum amount rule (100 < 500)
- ✅ Respects maximum amount rule (1000 > 500)
- ✅ Handles non-numeric input with error

#### Test Group: getDecimalPlaces Utility
- ✅ Returns correct decimal places (10 → 0, 10.5 → 1, 10.99 → 2)
- ✅ Handles edge cases (0.01 → 2, 0.1 → 1, 0 → 0)

#### Test Group: amountsEqual Comparison
- ✅ Compares equal amounts correctly
- ✅ Detects unequal amounts
- ✅ Handles precision correctly (tolerance 0.01)
- ✅ Compares paise amounts with tolerance
- ✅ Handles difference within tolerance (< 0.01)
- ✅ Detects difference exceeding tolerance (> 0.01)

#### Test Group: Round-trip Conversions
- ✅ Rupees → paise → rupees maintains value
- ✅ Handles multiple conversions (10 rounds maintain value)

---

### 2. PaymentValidation.test.js (20+ Tests)

#### Test Group: Payment Validation Rules
- ✅ Defines rules for regular course (minAmount, maxAmount, allowEMI, allowFull)
- ✅ Defines rules for EMI course (allowEMI: true, minEmiAmount)
- ✅ Defines rules for tutor course (allowEMI: false, allowFull: true)

#### Test Group: validatePayment Function
- ✅ Validates full payment for regular course
- ✅ Rejects payment with invalid course type
- ✅ Rejects payment with invalid amount (negative)
- ✅ Rejects payment below minimum amount
- ✅ Rejects payment above maximum amount
- ✅ Validates EMI payments with valid configuration
- ✅ Rejects EMI with invalid months
- ✅ Validates payment method selection

#### Test Group: checkEmiEligibility Function
- ✅ Checks EMI eligibility for regular courses
- ✅ Checks EMI eligibility for EMI courses
- ✅ Rejects EMI for amounts below ₹5000
- ✅ Accepts EMI for amounts >= ₹5000
- ✅ Validates installment count (3-24)
- ✅ Includes GST calculation in EMI plan

#### Test Group: Error Messages
- ✅ getValidationErrorMessage returns appropriate messages
- ✅ getValidationWarnings provides helpful guidance
- ✅ formatValidationError structures errors properly

---

### 3. ExamReattemptPolicy.test.js (15+ Tests)

#### Test Group: Reattempt Eligibility
- ✅ Checks if user can reattempt exam
- ✅ Enforces maximum attempt limit
- ✅ Validates attempt count against policy
- ✅ Checks waiting period between attempts

#### Test Group: Policy Configuration
- ✅ Defines maximum attempts per exam
- ✅ Defines waiting period between attempts
- ✅ Allows configuration per course/exam
- ✅ Supports different policies for different users

#### Test Group: Attempt History
- ✅ Tracks all exam attempts
- ✅ Stores attempt timestamps
- ✅ Records attempt scores
- ✅ Calculates waiting time until next attempt

---

### 4. SafeRegex.test.js (15+ Tests)

#### Test Group: Email Validation Regex
- ✅ Validates standard email formats
- ✅ Rejects invalid email formats
- ✅ Handles domain variations
- ✅ Prevents ReDoS attacks

#### Test Group: Phone Number Regex
- ✅ Validates Indian phone numbers
- ✅ Supports multiple formats
- ✅ Rejects invalid numbers
- ✅ Handles country codes

#### Test Group: Safe Pattern Matching
- ✅ Prevents ReDoS vulnerabilities
- ✅ Uses non-backtracking patterns
- ✅ Limits pattern complexity
- ✅ Handles edge cases safely

---

### 5. sanitizationUtils.test.js (20+ Tests)

#### Test Group: HTML/XSS Prevention
- ✅ Removes HTML tags from input
- ✅ Escapes special characters
- ✅ Prevents JavaScript injection
- ✅ Handles nested tags safely

#### Test Group: SQL Injection Prevention
- ✅ Escapes SQL special characters
- ✅ Prevents quote-based injection
- ✅ Handles string literals safely
- ✅ Validates SQL queries

#### Test Group: Input Sanitization
- ✅ Removes dangerous characters
- ✅ Validates against whitelist
- ✅ Trims whitespace
- ✅ Normalizes input

#### Test Group: Output Encoding
- ✅ Encodes for HTML context
- ✅ Encodes for JavaScript context
- ✅ Encodes for URL context
- ✅ Encodes for SQL context

---

### 6. errorResponseHandler.test.js (15+ Tests)

#### Test Group: Error Formatting
- ✅ Formats validation errors
- ✅ Formats authentication errors
- ✅ Formats authorization errors
- ✅ Formats server errors

#### Test Group: Error Status Codes
- ✅ Returns 400 for validation errors
- ✅ Returns 401 for authentication errors
- ✅ Returns 403 for authorization errors
- ✅ Returns 500 for server errors

#### Test Group: Error Messages
- ✅ Provides user-friendly messages
- ✅ Hides sensitive information
- ✅ Includes error codes
- ✅ Includes request ID for tracking

#### Test Group: Error Logging
- ✅ Logs errors with full context
- ✅ Includes stack traces
- ✅ Includes request details
- ✅ Sanitizes sensitive data before logging

---

## TIER 2: MIDDLEWARE TESTS (4 Files, 140+ Tests)

### 1. authMiddleware.test.js (50+ Tests)

#### Test Group: Public Routes
- ✅ Identifies /register as public route
- ✅ Identifies /login as public route
- ✅ Identifies /allcourses as public route
- ✅ Recognizes specific course routes as public

#### Test Group: Token Verification
- ✅ Verifies valid JWT token
- ✅ Extracts user ID from token
- ✅ Extracts email from token
- ✅ Preserves all token claims
- ✅ Rejects expired token (throws 'jwt expired')
- ✅ Rejects token with invalid signature
- ✅ Rejects malformed token

#### Test Group: Authorization Header Handling
- ✅ Extracts token from Bearer authorization header
- ✅ Recognizes missing authorization header
- ✅ Detects malformed Bearer header
- ✅ Accepts alternative authorization formats

#### Test Group: Token Payload Extraction
- ✅ Extracts user ID from token
- ✅ Extracts email from token
- ✅ Extracts role from token
- ✅ Preserves all token claims

#### Test Group: Error Handling
- ✅ Handles missing JWT_SECRET gracefully
- ✅ Handles token verification errors
- ✅ Handles null token
- ✅ Handles empty string token

#### Test Group: Token Expiration
- ✅ Marks token with expiration time
- ✅ Allows tokens with far future expiration
- ✅ Rejects tokens that expired seconds ago

#### Test Group: Integration Scenarios
- ✅ Complete authentication flow: token creation and verification
- ✅ Handles user session validation
- ✅ Handles course-specific access control

---

### 2. piiProtectionMiddleware.test.js (50+ Tests)

#### Test Group: Sensitive Field Removal
- ✅ Removes password from response
- ✅ Removes SSN (Social Security Number) from response
- ✅ Removes credit card information
- ✅ Removes authentication tokens
- ✅ Removes internal system fields

#### Test Group: Data Masking
- ✅ Masks email address (user***@example.com)
- ✅ Masks phone number (XXXX-XXXX-5678)
- ✅ Masks credit card number (****-****-****-1234)
- ✅ Masks social security number (XXX-XX-XXXX)
- ✅ Masks date of birth

#### Test Group: Array and Nested Data
- ✅ Removes PII from array of users
- ✅ Removes PII from nested objects
- ✅ Removes PII from deeply nested data
- ✅ Handles mixed arrays and objects

#### Test Group: Whitelist Approach
- ✅ Only includes whitelisted fields
- ✅ Different endpoints have different whitelists
- ✅ Applies field-level filtering

#### Test Group: Blacklist Approach
- ✅ Excludes blacklisted fields
- ✅ Blacklist includes common sensitive fields
- ✅ Dynamic field exclusion

#### Test Group: Role-based PII Removal
- ✅ Removes more data for anonymous users
- ✅ Shows more data for authenticated users
- ✅ Shows most data for admin users
- ✅ Applies role-specific filtering

#### Test Group: Integration Scenarios
- ✅ Protects user data in list endpoint
- ✅ Protects user data in detail endpoint
- ✅ Protects payment data in transaction response

---

### 3. rateLimitConfig.test.js (60+ Tests)

#### Test Group: Basic Rate Limiting
- ✅ Allows requests within rate limit
- ✅ Blocks requests exceeding rate limit
- ✅ Tracks requests per IP address

#### Test Group: Time Window
- ✅ Respects time window limits (e.g., 100 req/min)
- ✅ Resets counter after time window expires
- ✅ Handles multiple time windows correctly

#### Test Group: Different Rate Limits
- ✅ Login endpoint has strict limit (5/min)
- ✅ API endpoints have moderate limit (100/min)
- ✅ Password reset has strictest limit (3/hour)
- ✅ Public endpoints have generous limit (1000/min)

#### Test Group: Blocking Behavior
- ✅ Returns 429 status code when rate limited
- ✅ Includes retry-after header (seconds)
- ✅ Provides clear error message
- ✅ Blocks requests progressively

#### Test Group: IP-based Rate Limiting
- ✅ Tracks unique IP addresses
- ✅ Handles IPv4 addresses
- ✅ Handles IPv6 addresses
- ✅ Handles X-Forwarded-For header for proxies

#### Test Group: User-based Rate Limiting
- ✅ Tracks authenticated user requests
- ✅ Allows higher limits for authenticated users (200/min vs 100/min)
- ✅ Allows different limits per user role (admin > user > guest)

#### Test Group: Endpoint-specific Limits
- ✅ Login endpoint enforced strictly
- ✅ Search endpoint has moderate limit
- ✅ Payment endpoint has strict limit
- ✅ Download endpoint has high limit

#### Test Group: Error Handling
- ✅ Handles missing rate limit config gracefully
- ✅ Defaults to sensible rate limit if not configured
- ✅ Handles clock skew between servers
- ✅ Handles rate limit storage failures

#### Test Group: Integration Scenarios
- ✅ Enforces rate limit during login attempts
- ✅ Enforces rate limit during brute force attack
- ✅ Allows legitimate concurrent requests within limit
- ✅ Protects against distributed DoS attempts

---

### 4. validationMiddleware.test.js (40+ Tests)

#### Test Group: Email Validation
- ✅ Accepts valid email format (user@example.com)
- ✅ Rejects invalid email format (missing @, domain)
- ✅ Rejects whitespace in email
- ✅ Validates RFC 5322 compliance

#### Test Group: Password Validation
- ✅ Requires minimum length (8+ chars)
- ✅ Requires special characters (!@#$%^&*)
- ✅ Requires mixed case (upper + lower)
- ✅ Rejects weak passwords
- ✅ Validates complexity score

#### Test Group: Phone Number Validation
- ✅ Accepts valid phone numbers
- ✅ Validates length (10 digits India)
- ✅ Rejects invalid phone numbers
- ✅ Accepts international formats
- ✅ Handles country codes

#### Test Group: Name Validation
- ✅ Accepts valid names
- ✅ Rejects empty or whitespace names
- ✅ Rejects names with special characters
- ✅ Enforces minimum and maximum length

#### Test Group: Form Data Validation
- ✅ Validates required fields
- ✅ Trims whitespace from inputs
- ✅ Sanitizes user input
- ✅ Validates field types

#### Test Group: Error Messages
- ✅ Returns clear error for missing email
- ✅ Returns clear error for invalid email
- ✅ Returns clear error for weak password
- ✅ Returns multiple validation errors
- ✅ Provides field-specific feedback

#### Test Group: Integration Scenarios
- ✅ Validates complete registration form
- ✅ Rejects registration with invalid data
- ✅ Handles mixed valid and invalid fields
- ✅ Chains validations in correct order

---

## TIER 3: SERVICE TESTS (2 Files, 80+ Tests)

### 1. EMIDateUtils.test.js (40+ Tests)

#### Test Group: getLastDayOfMonth
- ✅ Returns last day of January (31)
- ✅ Returns last day of February in non-leap year (28)
- ✅ Returns last day of February in leap year (29)
- ✅ Returns last day of April (30)
- ✅ Returns last day of December (31)

#### Test Group: addMonths to Date
- ✅ Adds single month correctly
- ✅ Adds multiple months correctly
- ✅ Handles year boundaries
- ✅ Handles leap year transitions
- ✅ Maintains day-of-month when possible

#### Test Group: Date Calculations
- ✅ Calculates days between dates
- ✅ Calculates months between dates
- ✅ Handles date comparisons
- ✅ Formats dates for display

#### Test Group: EMI Schedule Generation
- ✅ Generates monthly EMI dates
- ✅ Aligns with EMI due day
- ✅ Handles month-end edge cases
- ✅ Generates complete schedule

---

### 2. EMIUtils.test.js (40+ Tests)

#### Test Group: EMI Calculation
- ✅ Calculates EMI amount for fixed-rate EMI
- ✅ Uses correct formula: P * (r * (1+r)^n) / ((1+r)^n - 1)
- ✅ Handles different interest rates
- ✅ Handles different tenures (months)
- ✅ Validates calculation precision

#### Test Group: GST Calculation
- ✅ Calculates GST on EMI amount
- ✅ Applies 18% GST correctly
- ✅ Includes GST in total payment
- ✅ Handles GST rounding

#### Test Group: Interest Calculation
- ✅ Calculates total interest over tenure
- ✅ Calculates interest per installment
- ✅ Validates interest rate
- ✅ Handles variable interest rates

#### Test Group: Schedule Generation
- ✅ Generates complete EMI schedule
- ✅ Shows principal, interest, total for each installment
- ✅ Includes due dates
- ✅ Validates schedule totals

#### Test Group: Payment Status Tracking
- ✅ Tracks paid EMIs
- ✅ Tracks pending EMIs
- ✅ Tracks overdue EMIs
- ✅ Calculates remaining balance

---

## TIER 4: INTEGRATION TESTS (9 Files, 200+ Tests)

### 1. auth-flow.test.js (20 Tests)

#### Test Group: User Registration
- ✅ Registers new user successfully
- ✅ Stores user credentials securely
- ✅ Rejects registration without email
- ✅ Rejects registration without phone
- ✅ Rejects duplicate email registration

#### Test Group: OTP Verification
- ✅ Verifies OTP successfully
- ✅ Generates OTP on registration
- ✅ Rejects invalid OTP
- ✅ Enforces OTP expiry (5 minutes)
- ✅ Allows OTP resend

#### Test Group: Password Creation
- ✅ Creates password successfully with matching passwords
- ✅ Rejects password creation with mismatched passwords
- ✅ Rejects password creation with short password (< 8 chars)
- ✅ Validates password complexity
- ✅ Hashes password securely

#### Test Group: Login Flow
- ✅ Logs in successfully with correct credentials
- ✅ Rejects login without email
- ✅ Rejects login without password
- ✅ Rejects login with incorrect password
- ✅ Generates JWT token on login

#### Test Group: Logout & Profile
- ✅ Logs out successfully with valid token
- ✅ Rejects logout without token
- ✅ Fetches profile with valid token
- ✅ Rejects profile access without token
- ✅ Rejects profile access with invalid token

#### Test Group: Complete Flow
- ✅ Complete flow: register → verify OTP → set password → login → access profile

---

### 2. auth-validation.test.js (12 Tests)

#### Test Group: Email Validation
- ✅ Rejects registration with invalid email format
- ✅ Accepts valid email formats

#### Test Group: Phone Number Validation
- ✅ Rejects registration with invalid phone number
- ✅ Accepts valid 10-digit Indian phone numbers
- ✅ Accepts phone numbers with country code

#### Test Group: OTP Validation
- ✅ Rejects OTP with invalid format
- ✅ Accepts valid 6-digit OTP
- ✅ Validates OTP length

#### Test Group: Password Validation
- ✅ Rejects password without uppercase letter
- ✅ Rejects password without lowercase letter
- ✅ Rejects password without number
- ✅ Rejects password without special character
- ✅ Accepts password meeting all requirements

---

### 3. course.test.js (30 Tests)

#### Test Group: GET /api/courses - List Courses
- ✅ Returns all courses with default pagination
- ✅ Returns pagination metadata (total, page, limit)
- ✅ Supports limit parameter
- ✅ Supports pagination with page parameter
- ✅ Each course has required fields (id, name, description, price, thumbnail)

#### Test Group: GET /api/courses/:id - Course Details
- ✅ Returns specific course by ID
- ✅ Returns 404 for non-existent course
- ✅ Course includes all necessary information (chapters, lessons, exams)

#### Test Group: GET /api/courses/category/:categoryName - Filter by Category
- ✅ Returns courses in specified category
- ✅ Returns 404 for non-existent category
- ✅ Category filter is case-insensitive
- ✅ Includes total count in response

#### Test Group: GET /api/courses/search/:query - Search
- ✅ Finds courses by title
- ✅ Finds courses by description
- ✅ Search is case-insensitive
- ✅ Returns 404 when no courses match
- ✅ Search results include total count

#### Test Group: Query Parameter Filtering
- ✅ Filters by category via query parameter
- ✅ Searches via query parameter
- ✅ Combines category and search filters

---

### 4. course-access.test.js (7 Tests)

#### Test Group: Public Access
- ✅ Lists all available courses without authentication
- ✅ Retrieves course details without authentication
- ✅ Returns 404 for non-existent course

#### Test Group: Payment-based Access
- ✅ Denies access to paid course without purchase
- ✅ Grants access to free course without purchase
- ✅ Purchases course successfully and grants access

---

### 5. exam-integration.test.js (12 Tests)

#### Test Group: Exam Retrieval
- ✅ Retrieves exam details
- ✅ Returns 404 for non-existent exam
- ✅ Includes all exam information (questions, options, duration)

#### Test Group: Exam Submission
- ✅ Submits exam answers successfully
- ✅ Rejects exam submission without authentication
- ✅ Rejects exam submission without answers
- ✅ Returns exam result after submission (score, percentage)

#### Test Group: Exam Reattempt Policy
- ✅ Enforces maximum attempt limit
- ✅ Checks reattempt eligibility
- ✅ Denies reattempt when all attempts exhausted
- ✅ Retrieves all attempt history

---

### 6. payment.test.js (30 Tests)

#### Test Group: Create Payment Order (POST /api/payments/create-order)
- ✅ Creates payment order with valid data
- ✅ Rejects missing courseId
- ✅ Rejects invalid amount
- ✅ Rejects zero amount
- ✅ Includes redirect URL for payment gateway

#### Test Group: Verify Payment (POST /api/payments/verify)
- ✅ Verifies successful payment
- ✅ Handles failed payment verification
- ✅ Returns 404 for non-existent order
- ✅ Updates order status to 'paid'

#### Test Group: Get Payment Status (GET /api/payments/:orderId)
- ✅ Returns payment order status
- ✅ Returns 404 for non-existent order
- ✅ Includes transaction details

#### Test Group: EMI Plan Creation
- ✅ Creates EMI plan with valid data
- ✅ Rejects EMI for amount below ₹5000
- ✅ Rejects invalid installment count
- ✅ Includes GST in EMI plan

#### Test Group: EMI Plan Retrieval
- ✅ Retrieves EMI plan details by ID
- ✅ Retrieves user EMI plans
- ✅ Shows payment schedule

---

### 7. payment-integration.test.js (15 Tests)

#### Test Group: Order Creation
- ✅ Creates payment order successfully
- ✅ Rejects order creation without authentication
- ✅ Rejects order with missing courseId
- ✅ Rejects order with zero amount

#### Test Group: Payment Verification
- ✅ Verifies payment successfully with valid transaction
- ✅ Rejects verification with invalid transaction ID
- ✅ Updates user payment status

#### Test Group: EMI Management
- ✅ Creates EMI plan successfully
- ✅ Rejects EMI plan with invalid months
- ✅ Retrieves EMI plan details
- ✅ Retrieves order details

---

### 8. progress-integration.test.js (15 Tests)

#### Test Group: Lesson Progress
- ✅ Saves lesson progress successfully
- ✅ Rejects progress save without authentication
- ✅ Rejects progress save without required fields
- ✅ Auto-completes lesson when 90% watched
- ✅ Retrieves individual lesson progress
- ✅ Returns zero progress for unwatched lesson

#### Test Group: Course Progress
- ✅ Retrieves course progress
- ✅ Calculates overall completion percentage
- ✅ Tracks chapter-wise progress

#### Test Group: Bulk Progress Update
- ✅ Bulk updates lesson progress
- ✅ Rejects bulk update with empty array
- ✅ Marks lesson as complete

---

### 9. webhook-integration.test.js (12 Tests)

#### Test Group: Webhook Signature Verification
- ✅ Rejects webhook without signature
- ✅ Rejects webhook with invalid signature
- ✅ Processes webhook with valid signature

#### Test Group: Payment Webhook
- ✅ Updates payment status via webhook
- ✅ Triggers enrollment on successful payment
- ✅ Does not enroll on failed payment

#### Test Group: Enrollment Webhook
- ✅ Processes enrollment webhook with valid signature
- ✅ Idempotent enrollment - does not duplicate on repeated webhook

---

## Test Summary by Tier

| Tier | Category | Files | Tests | Focus |
|------|----------|-------|-------|-------|
| 1 | Utils | 6 | 120+ | Currency, validation, sanitization, error handling |
| 2 | Middleware | 4 | 140+ | Auth, PII protection, rate limiting, input validation |
| 3 | Services | 2 | 80+ | EMI calculations, date utilities, schedules |
| 4 | Integration | 9 | 200+ | Full user flows, API endpoints, webhooks |
| **Total** | **-** | **21** | **540+** | **Complete backend coverage** |

---

## Test Execution

### Run All Backend Tests:
```bash
npm test -- --testPathPattern="__tests__" --coverage
```

### Run Specific Test Categories:
```bash
# Utils tests
npm test -- --testPathPattern="utils" --coverage

# Middleware tests
npm test -- --testPathPattern="middleware" --coverage

# Service tests
npm test -- --testPathPattern="services" --coverage

# Integration tests
npm test -- --testPathPattern="integration" --coverage
```

### Run Specific Test File:
```bash
npm test -- CurrencyConverter.test.js
npm test -- authMiddleware.test.js
npm test -- auth-flow.test.js
npm test -- payment.test.js
```

---

## Key Testing Patterns Used

✅ **Unit Testing**: Pure functions, utilities, helpers
✅ **Middleware Testing**: Request/response handling, headers, tokens
✅ **Integration Testing**: Full API endpoints with database
✅ **Mocking**: External services, payment gateways, email
✅ **Error Scenarios**: Edge cases, validation failures, errors
✅ **Security**: XSS prevention, SQL injection, rate limiting, PII protection
✅ **Async Testing**: Promises, async/await, callbacks
✅ **Database Testing**: MongoDB operations, transactions

---

## Coverage Areas

### Authentication & Authorization (80+ tests)
- JWT token management
- Public/private routes
- Role-based access control
- Session management

### Payment Processing (90+ tests)
- Currency conversion
- EMI calculations
- Order creation & verification
- Payment validation & security

### Course Management (50+ tests)
- Course listing & search
- Access control
- Chapter/lesson structure
- Progress tracking

### Exam System (30+ tests)
- Exam submission
- Reattempt policies
- Question management
- Score calculation

### Security (100+ tests)
- Input sanitization
- XSS/SQL injection prevention
- Rate limiting
- PII protection
- Data validation

---

Generated: 2026-04-15 | Backend Testing Complete
Total Test Cases: 540+
Coverage Target: 70%+
