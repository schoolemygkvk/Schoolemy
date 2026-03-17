# Schoolemy Backend API

A comprehensive **Node.js + Express.js** backend system for an **Online Course Learning Management System (LMS)** with advanced features including course management, payment processing with Razorpay, EMI (Equated Monthly Installment) plans, automated notifications, exam management, PCM class management, announcements, and notification bell system.

---

## 📋 Table of Contents

- [Project Overview](#-project-overview)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Project Architecture](#-project-architecture)
- [Folder Structure](#-folder-structure)
- [Database Schema](#-database-schema)
- [Installation & Setup](#-installation--setup)
- [Environment Configuration](#-environment-configuration)
- [Running the Application](#-running-the-application)
- [API Documentation](#-api-documentation)
- [EMI System Architecture](#-emi-system-architecture)
- [Payment Integration](#-payment-integration)
- [Notification System](#-notification-system)
- [Authentication & Authorization](#-authentication--authorization)
- [AWS Lambda Deployment](#-aws-lambda-deployment)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Best Practices](#-best-practices)
- [Contributing](#-contributing)

---

## 🎯 Project Overview

**Schoolemy Backend** is a robust RESTful API backend for an e-learning platform that enables:

- **User Management**: Registration, authentication, profile management with OTP verification
- **Course Management**: Multi-media course content (video, audio, PDF), chapter-based learning
- **Payment Processing**: Razorpay integration with full payment and EMI options
- **EMI System**: Advanced EMI plan management with automated reminders, overdue tracking, and course access control
- **Exam System**: Chapter-wise exams with answer submission and result tracking
- **PCM Class Management**: Physics, Chemistry, Mathematics class management system
- **Announcements**: System-wide announcement management
- **Notification Bell**: Real-time notification system for users
- **Notification System**: Multi-channel notifications (Email, SMS, WhatsApp) via Nodemailer and Twilio
- **Admin Panel**: Course creation, user management, EMI administration
- **File Management**: AWS S3 integration for media storage
- **Serverless Deployment**: AWS Lambda + API Gateway + EventBridge for scalable infrastructure

---

## ✨ Key Features

### 1. **User Authentication & Authorization**

- Email and mobile-based registration with OTP verification
- JWT-based authentication with 5-day token expiry
- Role-based access control (User/Admin)
- Forgot password with OTP verification
- Profile picture upload to AWS S3
- Login/logout tracking with session management

### 2. **Course Management**

- Hierarchical course structure: Course → Chapters → Lessons
- Multi-media support: Audio, Video, PDF files
- Course categories and difficulty levels (Beginner/Medium/Hard)
- Course thumbnails and preview videos
- Dynamic pricing with discount support
- EMI availability configuration per course
- Course enrollment tracking
- Course access control based on payment status

### 3. **Payment System**

- Razorpay integration for secure payments
- Two payment modes:
  - **Full Payment**: One-time course purchase
  - **EMI Payment**: Installment-based payments (6, 12, 24 months)
- Payment verification with signature validation
- Webhook handling for payment status updates
- Transaction history and receipt generation

### 4. **Advanced EMI System**

- Flexible EMI plans with configurable duration (6/12/24 months)
- User-selectable due dates (1-15 of each month)
- Automated EMI schedule generation
- Grace period management (3 days)
- Overdue tracking and notifications
- Course access locking/unlocking based on payment status
- EMI payment history and status tracking
- Bulk overdue payment support
- **AWS EventBridge Integration**: Automated cron jobs via AWS Lambda (daily at 10:00 AM IST)

### 5. **Automated Notification System**

- **Email Notifications**: Welcome emails, payment reminders, overdue notices
- **SMS Notifications**: Via Twilio for critical alerts
- **WhatsApp Notifications**: Payment reminders and updates
- **AWS EventBridge Scheduled Jobs**: Automated reminders via Lambda functions
- Rich HTML email templates
- Notification history tracking

### 6. **Exam Management**

- Chapter-wise exam creation
- Multiple question types support
- Exam attempt tracking
- Score calculation and result storage
- User exam history

### 7. **PCM Class Management** ✨ NEW

- Physics, Chemistry, Mathematics class management
- Class enrollment and tracking
- Material distribution
- Join request system

### 8. **Announcements System** ✨ NEW

- System-wide announcement creation
- Announcement categories
- User-specific announcements
- Announcement tracking and history

### 9. **Notification Bell System** ✨ NEW

- Real-time notification bell for users
- Join request notifications
- Material upload notifications
- Notification status tracking (read/unread)
- Notification history

### 10. **Admin Features**

- Course creation with multi-media upload
- Course content management (CRUD operations)
- EMI plan administration
- User payment monitoring
- System health checks
- PCM class management
- Announcement management

---

## 🛠 Tech Stack

### **Backend Framework**

- **Node.js** (v20+)
- **Express.js** (v5.1.0)

### **Database**

- **MongoDB** (v8.19.3) with Mongoose ODM
- MongoDB Atlas for cloud database hosting

### **Authentication & Security**

- **JWT** (jsonwebtoken v9.0.2)
- **Bcryptjs** (v3.0.3) for password hashing
- **Crypto** for signature verification

### **Payment Integration**

- **Razorpay** (v2.9.6)

### **Cloud Services**

- **AWS S3** for media storage
- **AWS Lambda** for serverless functions
- **AWS API Gateway** for API management
- **AWS EventBridge** for scheduled cron jobs
- **AWS CloudWatch** for logging and monitoring

### **Infrastructure as Code**

- **Terraform** for AWS infrastructure provisioning
- **Terraform Modules**: Lambda, API Gateway, EventBridge, IAM

### **Communication**

- **Nodemailer** (v7.0.10) for email
- **Twilio** for SMS/WhatsApp (via MobileTransport utility)

### **Utilities**

- **CORS** (v2.8.5)
- **Dotenv** (v16.6.1) for environment variables
- **Node-cron** (v4.2.1) for local scheduled tasks (development only)
- **Serverless-http** (required for AWS Lambda deployment)

### **Development Tools**

- **Nodemon** (v3.1.11)
- **Jest** (for testing - to be added)
- **Supertest** (for API testing - to be added)

---

## 🏗 Project Architecture

```
┌─────────────────┐
│   Client/UI     │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│      AWS API Gateway (Production)       │
│      OR Express Server (Development)    │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│         Express.js Middleware           │
│  ├─ CORS                                │
│  ├─ JSON Parser                         │
│  ├─ Authentication (JWT)                │
│  └─ Route Protection                    │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│            Routes Layer                 │
│  ├─ User Routes                         │
│  ├─ Course Routes                       │
│  ├─ Payment Routes                      │
│  ├─ EMI Routes                          │
│  ├─ Exam Routes                         │
│  ├─ PCM Class Routes                    │
│  ├─ Announcement Routes                 │
│  ├─ Notification Bell Routes            │
│  ├─ Admin Routes                        │
│  └─ Webhook Routes                      │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│         Controllers Layer               │
│  ├─ Business Logic                      │
│  ├─ Request Validation                  │
│  ├─ Response Formatting                 │
│  └─ Error Handling                      │
└────────┬────────────────────────────────┘
         │
         ├──────────────┬─────────────────┐
         ▼              ▼                 ▼
┌────────────┐  ┌──────────────┐  ┌─────────────┐
│  Services  │  │ Middleware   │  │ Utilities   │
│  Layer     │  │ Layer        │  │ Layer       │
└────┬───────┘  └──────┬───────┘  └──────┬──────┘
     │                 │                  │
     ▼                 ▼                  ▼
┌─────────────────────────────────────────┐
│           Models Layer (Mongoose)       │
│  ├─ User Model                          │
│  ├─ Course Model                        │
│  ├─ Payment Model                       │
│  ├─ EMI Plan Model                      │
│  ├─ Exam Models                         │
│  ├─ PCM Class Model                     │
│  ├─ Announcement Model                  │
│  └─ Notification Models                 │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│          MongoDB Database               │
└─────────────────────────────────────────┘

External Services:
├─ Razorpay (Payments)
├─ AWS S3 (File Storage)
├─ AWS Lambda (Serverless Functions)
├─ AWS EventBridge (Scheduled Jobs)
├─ Twilio (SMS/WhatsApp)
└─ Gmail SMTP (Email)
```

### **AWS Lambda Architecture**

```
┌─────────────────────────────────────────┐
│      AWS EventBridge (Cron Scheduler)   │
│      Schedule: Daily at 10:00 AM IST    │
│      Expression: cron(30 4 * * ? *)     │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│      Lambda Function (cron-handler.js)  │
│      - processOverdueEmis()             │
│      - sendPaymentReminders()           │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│         MongoDB Database                │
│         Notification Services           │
└─────────────────────────────────────────┘
```

---

## 📁 Folder Structure

```
schoolemy-node-user-backend/
├── server.js                      # Application entry point
├── handler.js                     # AWS Lambda handler (serverless-http)
├── cron-handler.js                # AWS Lambda handler for EventBridge cron jobs
├── package.json                   # Dependencies and scripts
├── package-lock.json              # Locked dependencies
├── .env                          # Environment variables (git-ignored)
├── .env.example                  # Environment template (to be created)
├── .gitignore                    # Git ignore rules (to be created)
├── README.md                     # Project documentation
│
├── terraform/                    # Infrastructure as Code
│   ├── main.tf                   # Main Terraform configuration
│   ├── variables.tf             # Terraform variables
│   ├── outputs.tf               # Terraform outputs
│   ├── provider.tf              # AWS provider configuration
│   ├── terraform.tfvars         # Terraform variable values
│   └── modules/                 # Terraform modules
│       ├── lambda/              # Lambda function module
│       ├── api_gateway/         # API Gateway module
│       ├── eventbridge/         # EventBridge module
│       └── iam/                 # IAM role module
│
├── uploads/                      # Temporary upload directory
│
└── src/
    ├── config/                   # Configuration files
    │   
    │
    ├── Controllers/              # Request handlers
    │   ├── Announcement-Controller/
    │   │   └── AnnouncementController.js
    │   ├── Course-Controller/
    │   │   └── Course-Controller.js
    │   ├── Emi-Controller/
    │   │   └── EmiController.js
    │   ├── Exam-Controller/
    │   │   ├── Exam-Question-Controll.js
    │   │   └── User-Submit-Answer.js
    │   ├── NotificationBell/
    │   │   ├── JoinRequestController.js
    │   │   ├── MaterialController.js
    │   │   └── NotificationController.js
    │   ├── Payment-controller/
    │   │   ├── Payment-Controller.js
    │   │   └── Webhook-Handler.js
    │   ├── PCM-Class-Controller/
    │   │   └── PCMClassController.js
    │   ├── Purchased-courses/
    │   │   └── purchasedcourse-controller.js
    │   └── user-Controller/
    │       ├── User-Auth-Controller.js
    │       └── user-profile-controller.js
    │
    ├── DB/
    │   └── db.js                 # MongoDB connection
    │
    ├── Middleware/               # Custom middleware
    │   ├── authMiddleware.js    # JWT verification
    │   └── EMI-accessMiddleware.js # Course access control
    │
    ├── Models/                   # Mongoose schemas
    │   ├── Announcement-Model/
    │   │   └── Announcement.js
    │   ├── Course-Model/
    │   │   └── Course-model.js
    │   ├── Emi-Plan/
    │   │   └── Emi-Plan-Model.js
    │   ├── Exam-Model/
    │   │   ├── Exam-Question-Model.js
    │   │   └── User-Submit-Model.js
    │   ├── NotificationBell/
    │   │   ├── JoinRequestModel.js
    │   │   ├── NotificationModel.js
    │   │   └── SentMaterialModel.js
    │   ├── Payment-Model/
    │   │   └── Payment-Model.js
    │   ├── PCM-Class-Model/
    │   │   └── PCMClass.js
    │   └── User-Model/
    │       └── User-Model.js
    │
    ├── Notification/             # Notification services
    │   └── EMI-Notification.js
    |   |── EmailTransport.js    # Email sending
    │
    ├── Routes/                   # API routes
    │   ├── Announcement-Routes/
    │   │   └── AnnouncementRoutes.js
    │   ├── Course-routes/
    │   │   └── Course-routes.js
    │   ├── Exan-Question-Routes.js/
    │   │   └── Exam-Question-Routes.js
    │   ├── NotificationBell/
    │   │   ├── joinRequestRoutes.js
    │   │   ├── materialRoutes.js
    │   │   └── NotificationRoutes.js
    │   ├── Payment-Routes/
    │   │   └── Payment-Routes.js
    │   ├── PCM-Class-Routes/
    │   │   └── PCMClassRoutes.js
    │   ├── Purchased-routes/
    │   │   └── Purchased-routs.js
    │   └── users-routes/
    │       ├── User-Routes.js
    │       └── user-profile-routes.js
    │
    ├── Services/                 # Business logic services
    │   ├── EMI-Cron.js          # Local cron jobs (development)
    │   ├── EMI-DateUtils.js     # Date calculation utilities
    │   ├── EMI-Service.js       # EMI management service
    │   └── EMI-Utils.js         # EMI helper functions
    │
    └── Utils/                    # Utility functions
        ├── JwtToken.js          # JWT generation
        ├── logger.js            # Logging utility
        ├── MobileTranspost.js   # SMS/WhatsApp utility
        ├── OTPGenerate.js       # OTP generation
        └── validate.js          # Input validation
```

---

## 💾 Database Schema

### **User Schema**

```javascript
{
  studentRegisterNumber: String (unique),
  email: String (unique),
  mobile: String (unique),
  password: String (hashed),
  role: String (default: "user"),
  username: String,
  fatherName: String,
  dateofBirth: Date,
  gender: String,
  address: {
    street, city, state, country, zipCode
  },
  profilePicture: {
    public_id: String,
    url: String
  },
  enrolledCourses: [{
    course: ObjectId (ref: Course),
    enrollmentDate: Date,
    progress: Number,
    accessStatus: String (active/locked)
  }],
  loginHistory: [{
    loginTime, ipAddress, userAgent, logoutTime, sessionDuration
  }],
  status: String (active/inactive/logged-out)
}
```

### **Course Schema**

```javascript
{
  CourseMotherId: String,
  coursename: String (unique),
  category: String,
  courseduration: String (6 months/1 year/2 years),
  thumbnail: String,
  previewvideo: String,
  contentduration: { hours, minutes },
  chapters: [{
    title: String,
    lessons: [{
      lessonname: String,
      audioFile: [{ name, url }],
      videoFile: [{ name, url }],
      pdfFile: [{ name, url }]
    }],
    exam: ObjectId (ref: ExamQuestion)
  }],
  price: {
    amount: Number,
    currency: String,
    discount: Number,
    finalPrice: Number
  },
  emi: {
    isAvailable: Boolean,
    emiDurationMonths: Number,
    monthlyAmount: Number,
    totalAmount: Number,
    notes: String
  },
  level: String (beginner/medium/hard),
  instructor: [{ name, role, socialmedia_id }],
  isActive: Boolean
}
```

### **Payment Schema**

```javascript
{
  userId: ObjectId (ref: User),
  courseId: ObjectId (ref: Course),
  username: String,
  studentRegisterNumber: String,
  email: String,
  mobile: String,
  CourseMotherId: String,
  courseName: String,
  paymentType: String (full/emi/emi_overdue/emi_installment),
  emiDueDay: Number,
  emiPlanId: ObjectId (ref: EMIPlan),
  emiInstallments: [{
    emiId: ObjectId,
    month: Number,
    monthName: String,
    amount: Number,
    dueDate: Date,
    wasOverdue: Boolean
  }],
  amount: Number,
  currency: String,
  paymentStatus: String (pending/completed/failed/cancelled),
  transactionId: String (unique),
  paymentMethod: String,
  razorpayOrderId: String,
  razorpayPaymentId: String,
  razorpaySignature: String
}
```

### **EMI Plan Schema**

```javascript
{
  userId: ObjectId (ref: User),
  username: String,
  studentRegisterNumber: String,
  email: String,
  mobile: String,
  courseId: ObjectId (ref: Course),
  CourseMotherId: String,
  coursename: String,
  coursePrice: Number,
  courseduration: String,
  totalAmount: Number,
  emiPeriod: Number,
  selectedDueDay: Number (1-15),
  startDate: Date,
  status: String (active/locked/completed/cancelled),
  emis: [{
    month: Number,
    monthName: String,
    dueDate: Date,
    amount: Number,
    status: String (pending/paid/late),
    paymentDate: Date,
    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpaySignature: String,
    gracePeriodEnd: Date
  }],
  lockHistory: [{
    lockDate: Date,
    unlockDate: Date,
    overdueMonths: Number,
    reasonForLock: String,
    lockedBy: String
  }],
  notifications: [{
    type: String (reminder/overdue/final_notice/welcome/lock/unlock),
    sentAt: Date,
    channel: String (gmail/sms/whatsapp),
    status: String (sent/failed/pending),
    metadata: Object
  }]
}
```

---

## 🚀 Installation & Setup

### **Prerequisites**

- Node.js (v20 or higher)
- MongoDB (v4.4 or higher) or MongoDB Atlas account
- AWS Account (for S3, Lambda, API Gateway, EventBridge)
- Terraform (v1.0+) for infrastructure deployment
- Razorpay account (for payments)
- Twilio account (for SMS/WhatsApp)
- Gmail account (for email notifications)

### **Step 1: Clone the Repository**

```bash
git clone <repository-url>
cd Schoolemy-Node-User-Backend
```

### **Step 2: Install Dependencies**

```bash
npm install
```

**⚠️ Important**: Add `serverless-http` to dependencies if deploying to AWS Lambda:

```bash
npm install serverless-http
```

### **Step 3: Configure Environment Variables**

Create a `.env` file in the root directory:

```bash
cp .env.example .env  # If .env.example exists
# Or create .env manually
```

Edit the `.env` file with your credentials (see [Environment Configuration](#-environment-configuration) section).

### **Step 4: Start MongoDB**

Ensure MongoDB is running locally or use MongoDB Atlas connection string.

### **Step 5: Run the Application**

#### **Development Mode (Local Server)**

```bash
npm install

# Development mode with auto-reload
npm run dev

# Production mode
npm start
npm run start
```

The server will start on `https://schoolemy-user-new-backend.onrender.com`

#### **AWS Lambda Deployment**

See [AWS Lambda Deployment](#-aws-lambda-deployment) section for detailed instructions.

---

## 🔧 Environment Configuration

Create a `.env` file with the following variables:

```env
# Server Configuration
PORT=8000
NODE_ENV=development  # development | production | testing

# Database
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/schoolemy-main

# JWT Secret
JWT_SECRET=your_secret_key_here

# Email Configuration (Gmail)
EMAIL_ADMIN=your-email@gmail.com
EMAIL_PASS=your-app-specific-password

# Twilio Configuration
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_WHATSAPP_NUMBER=+1234567890

# Razorpay Configuration
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret

# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_BUCKET_NAME=your-bucket-name
AWS_REGION=ap-south-1

# Suppress AWS SDK warnings
AWS_SDK_JS_SUPPRESS_MAINTENANCE_MODE_MESSAGE=1
```

### **Important Notes:**

1. **Gmail App Password**: Enable 2-factor authentication and generate an app-specific password
2. **Twilio**: Verify your phone number in Twilio console for testing
3. **Razorpay**: Use test keys for development, live keys for production
4. **AWS S3**: Create a bucket with proper permissions for public read access
5. **AWS Lambda**: IAM role will be created by Terraform, no need to set AWS credentials in Lambda environment
6. **Never commit `.env` file** - Add it to `.gitignore`

---

## 🏃 Running the Application

### **Development Mode (Local)**

```bash
npm run dev
```

Uses nodemon for auto-reload on file changes.

### **Production Mode (Local)**

```bash
npm start
```

### **Health Check**

```bash
curl https://schoolemy-user-new-backend.onrender.com/health
```

**Response:**

```json
{
  "status": "ok",
  "service": "NodeJS API",
  "timestamp": "2025-11-04T10:30:00.000Z",
  "environment": "development",
  "dependencies": {
    "database": "connected"
  }
}
```

---

## 📚 API Documentation

### **Base URL**

**Local Development:**
```
https://schoolemy-user-new-backend.onrender.com
```

**AWS Lambda (Production):**
```
https://<api-gateway-url>.execute-api.<region>.amazonaws.com/<stage>
```

### **Authentication**

Most endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

### **Public Routes (No Authentication Required)**

- `POST /register` - User registration
- `POST /verify-otp` - OTP verification
- `POST /login` - User login
- `GET /courses/user-view` - View all courses
- `GET /api/announcements` - Get announcements
- `GET /api/pcm` - Get PCM classes
- `POST /webhook/razorpay` - Razorpay webhook

### **Protected Routes (Authentication Required)**

All other routes require JWT token in the Authorization header.

---

## 🔄 EMI System Architecture

### **EMI Workflow**

```
┌─────────────────────────────────────────────┐
│  1. User Selects EMI Payment Option         │
│     - Selects due day (1-15)                │
│     - Chooses EMI duration (6/12/24 months) │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│  2. EMI Plan Creation                       │
│     - Calculate monthly amount              │
│     - Generate EMI schedule                 │
│     - Set grace periods                     │
│     - Create first EMI order                │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│  3. First EMI Payment (Instant)             │
│     - Pay via Razorpay                      │
│     - Mark first EMI as paid                │
│     - Grant course access                   │
│     - Send welcome notification             │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│  4. AWS EventBridge Scheduled Jobs          │
│     (Daily at 10:00 AM IST via Lambda)      │
│     ┌─────────────────────────────────────┐ │
│     │  Check for upcoming due dates       │ │
│     │  Send reminder notifications        │ │
│     │  (3 days before, 1 day before)      │ │
│     └─────────────────────────────────────┘ │
│     ┌─────────────────────────────────────┐ │
│     │  Check for overdue EMIs             │ │
│     │  Send overdue notifications         │ │
│     │  Lock course access if needed       │ │
│     └─────────────────────────────────────┘ │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│  5. Monthly Payment Cycle                   │
│     - User pays monthly EMI                 │
│     - System verifies payment               │
│     - Update EMI status                     │
│     - Unlock course access if locked        │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│  6. Overdue Handling                        │
│     - Grace period: 3 days after due date   │
│     - After grace: Mark as "late"           │
│     - Send escalated notifications          │
│     - Lock course access                    │
│     - Allow bulk overdue payment            │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│  7. Completion                              │
│     - All EMIs paid                         │
│     - Mark plan as "completed"              │
│     - Permanent course access               │
│     - Send completion notification          │
└─────────────────────────────────────────────┘
```

### **AWS EventBridge Cron Job**

The EMI cron jobs run via AWS EventBridge, which triggers a Lambda function daily at 10:00 AM IST.

**Schedule Expression:**
```
cron(30 4 * * ? *)  # 4:30 AM UTC = 10:00 AM IST
```

**Lambda Handler:** `cron-handler.js`

**Tasks:**
1. `processOverdueEmis()` - Lock course access for overdue payments
2. `sendPaymentReminders()` - Send reminder emails to users

---

## ☁️ AWS Lambda Deployment

### **Overview**

This project supports serverless deployment on AWS Lambda with the following infrastructure:

- **AWS Lambda**: Serverless function hosting
- **API Gateway**: REST API endpoint
- **EventBridge**: Scheduled cron jobs (EMI reminders)
- **CloudWatch**: Logging and monitoring
- **IAM**: Role-based permissions
- **Terraform**: Infrastructure as Code

### **Prerequisites**

1. **AWS Account** with appropriate permissions
2. **Terraform** installed (v1.0+)
3. **AWS CLI** configured with credentials
4. **Node.js** and dependencies installed

### **Step 1: Install Terraform**

```bash
# macOS
brew install terraform

# Windows
# Download from https://www.terraform.io/downloads
```

### **Step 2: Configure AWS Credentials**

```bash
aws configure
```

Enter your AWS Access Key ID and Secret Access Key.

### **Step 3: Prepare Lambda Deployment Package**

```bash
# Install dependencies
npm install

# Create deployment package
zip -r lambda-deployment.zip . -x "*.git*" "*.terraform*" "terraform/*" "node_modules/.bin/*" ".env*"
```

### **Step 4: Configure Terraform Variables**

Edit `terraform/terraform.tfvars`:

```hcl
project_name = "schoolemy-backend"
environment  = "production"

# Lambda Configuration
lambda_handler     = "handler.handler"
lambda_runtime     = "nodejs20.x"
lambda_timeout     = 30
lambda_memory_size = 512

# Lambda Zip File
lambda_zip_file = "../lambda-deployment.zip"

# MongoDB
mongo_url = "mongodb+srv://..."

# JWT Secret
jwt_secret = "your-secret-key"

# Razorpay
razorpay_key_id     = "rzp_test_..."
razorpay_key_secret = "your-secret"

# Email
email_admin = "your-email@gmail.com"
email_pass  = "your-app-password"

# Twilio
twilio_account_sid  = "your-account-sid"
twilio_auth_token   = "your-auth-token"
twilio_phone_number = "+1234567890"
twilio_whatsapp_number = "+1234567890"

# AWS S3
aws_bucket_name = "your-bucket-name"
enable_s3_access = true

# Node Environment
node_env = "production"
```

### **Step 5: Deploy Infrastructure**

```bash
# Navigate to Terraform directory
cd terraform

# ----------------------------------------
# 1. Initialize Terraform
# ----------------------------------------
terraform init

# ----------------------------------------
# 2. Format and Validate Terraform files
# ----------------------------------------
terraform fmt
terraform validate

# ----------------------------------------
# 3. Package Lambda Function (PowerShell)
#    This prepares the deployment zip for AWS Lambda
# ----------------------------------------
Compress-Archive -Path src, node_modules, handler.js, cron-handler.js, server.js, package.json -DestinationPath lambda.zip -Force

# (For Linux/macOS users)
# zip -r lambda.zip src node_modules handler.js cron-handler.js server.js package.json

# ----------------------------------------
# 4. Plan Deployment
# ----------------------------------------
terraform plan

# OR (recommended: with environment variables)
terraform plan -var-file="environment/dev.tfvars"

# ----------------------------------------
# 5. Apply Deployment
# ----------------------------------------
terraform apply

# OR (recommended: with environment variables)
terraform apply -var-file="environment/dev.tfvars" -auto-approve

# ----------------------------------------
# 6. View Terraform Outputs
# ----------------------------------------
terraform output



```

### **Step 6: Get API Gateway URL**

After deployment, get the API Gateway URL:

```bash
terraform output api_gateway_url
```

### **Lambda Functions**

#### **1. Main API Lambda (`handler.js`)**

- **Handler**: `handler.handler`
- **Runtime**: Node.js 20.x
- **Timeout**: 30 seconds
- **Memory**: 512 MB
- **Trigger**: API Gateway

#### **2. Cron Job Lambda (`cron-handler.js`)**

- **Handler**: `cron-handler.handler`
- **Runtime**: Node.js 20.x
- **Timeout**: 300 seconds (5 minutes)
- **Memory**: 512 MB
- **Trigger**: EventBridge (daily at 10:00 AM IST)

### **EventBridge Schedule**

The cron job runs daily at 10:00 AM IST via EventBridge:

```hcl
schedule_expression = "cron(30 4 * * ? *)"  # 4:30 AM UTC = 10:00 AM IST
```

### **Updating Lambda Code**

```bash
# 1. Update code
# 2. Create new deployment package
zip -r lambda-deployment.zip . -x "*.git*" "*.terraform*" "terraform/*"

# 3. Update Lambda function
aws lambda update-function-code \
  --function-name schoolemy-backend-production \
  --zip-file fileb://lambda-deployment.zip

# Or use Terraform
terraform apply
```

### **Monitoring**

- **CloudWatch Logs**: `/aws/lambda/schoolemy-backend-production`
- **CloudWatch Metrics**: Lambda invocations, errors, duration
- **EventBridge Rules**: Cron job execution history

### **Troubleshooting**

1. **Check CloudWatch Logs**:
   ```bash
   aws logs tail /aws/lambda/schoolemy-backend-production --follow
   ```

2. **Test Lambda Function**:
   ```bash
   aws lambda invoke \
     --function-name schoolemy-backend-production \
     --payload '{"httpMethod":"GET","path":"/health"}' \
     response.json
   ```

3. **Check EventBridge Rule**:
   ```bash
   aws events describe-rule --name schoolemy-backend-production-emi-cron
   ```

---

## 🧪 Testing

### **Local Testing**

```bash
# Run server locally
npm run dev

# Test endpoints
curl https://schoolemy-user-new-backend.onrender.com/health
```

### **Lambda Testing**

```bash
# Test Lambda function locally
node -e "import('./handler.js').then(m => m.handler({}, {}, console.log))"
```

### **Test Cron Handler**

```bash
# Test cron handler locally
node -e "import('./cron-handler.js').then(m => m.handler({time: new Date().toISOString()}, {}, console.log))"
```

---

## 🚀 Deployment

### **Production Checklist**

- [ ] Set `NODE_ENV=production` in `.env`
- [ ] Use production MongoDB connection string
- [ ] Use Razorpay live keys
- [ ] Configure proper AWS S3 bucket permissions
- [ ] Set up proper CORS origins in API Gateway
- [ ] Enable HTTPS/SSL in API Gateway
- [ ] Set up environment variables in Terraform
- [ ] Configure logging and monitoring in CloudWatch
- [ ] Set up automated backups for MongoDB
- [ ] Configure rate limiting in API Gateway
- [ ] Enable security headers
- [ ] Test Lambda functions
- [ ] Test EventBridge cron jobs
- [ ] Monitor CloudWatch logs

### **Deployment Options**

#### **1. AWS Lambda + API Gateway (Recommended)**

See [AWS Lambda Deployment](#-aws-lambda-deployment) section.

#### **2. AWS EC2**

```bash
# SSH into EC2
ssh -i keypair.pem ubuntu@your-ec2-ip

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone and setup
git clone <repo>
cd Schoolemy-Node-User-Backend
npm install --production

# Use PM2 for process management
npm install -g pm2
pm2 start server.js --name schoolemy-backend
pm2 startup
pm2 save
```

#### **3. Docker**

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 8000
CMD ["node", "server.js"]
```

```bash
docker build -t schoolemy-backend .
docker run -p 8000:8000 --env-file .env schoolemy-backend
```

---

## 🎯 Best Practices

### **1. Code Organization**

- ✅ Separate concerns: Routes → Controllers → Services → Models
- ✅ Use meaningful variable and function names
- ✅ Keep controllers thin, business logic in services
- ✅ Use async/await instead of callbacks

### **2. Security**

- ✅ Never commit `.env` file
- ✅ Use strong JWT secrets
- ✅ Implement rate limiting in API Gateway
- ✅ Validate all user inputs
- ✅ Sanitize data before database operations
- ✅ Use HTTPS in production
- ✅ Keep dependencies updated

### **3. Database**

- ✅ Use indexes for frequently queried fields
- ✅ Implement proper error handling for database operations
- ✅ Use transactions for multi-document updates
- ✅ Regularly backup database
- ✅ Monitor database performance

### **4. Error Handling**

- ✅ Use try-catch blocks
- ✅ Return consistent error responses
- ✅ Log errors with context (CloudWatch)
- ✅ Don't expose sensitive information in error messages

### **5. Performance**

- ✅ Use lean() for read-only queries
- ✅ Implement pagination for large datasets
- ✅ Cache frequently accessed data
- ✅ Optimize database queries
- ✅ Use compression middleware

### **6. AWS Lambda Best Practices**

- ✅ Keep Lambda functions small and focused
- ✅ Use environment variables for configuration
- ✅ Implement proper error handling
- ✅ Use CloudWatch for logging
- ✅ Monitor Lambda metrics (duration, errors, throttles)
- ✅ Use Lambda layers for common dependencies
- ✅ Optimize cold start times

### **7. Terraform Best Practices**

- ✅ Use variables for configuration
- ✅ Use modules for reusable components
- ✅ Tag all resources
- ✅ Use remote state (S3 backend)
- ✅ Version control Terraform files
- ✅ Review Terraform plan before applying

---

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

### **Getting Started**

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### **Code Standards**

- Follow existing code style
- Write meaningful commit messages
- Add tests for new features
- Update documentation
- Ensure all tests pass before submitting PR

---

## 📄 License

This project is licensed under the ISC License.

---

## 👥 Team & Support

**Developed by:** Logical Minds IT Solutions  
**Contact:** logicalmindsit.careers@gmail.com

### **Support**

- 📧 Email: logicalmindsit.careers@gmail.com
- 🐛 Issues: [GitHub Issues](https://github.com/logicalmindsit/schoolemy-backend/issues)
- 📖 Documentation: This README

---

## 🙏 Acknowledgments

- [Express.js](https://expressjs.com/) - Web framework
- [MongoDB](https://www.mongodb.com/) - Database
- [Razorpay](https://razorpay.com/) - Payment gateway
- [AWS Lambda](https://aws.amazon.com/lambda/) - Serverless computing
- [AWS EventBridge](https://aws.amazon.com/eventbridge/) - Event scheduling
- [Terraform](https://www.terraform.io/) - Infrastructure as Code
- [Twilio](https://www.twilio.com/) - Communication API
- [Nodemailer](https://nodemailer.com/) - Email service

---

## 📊 Project Status

**Current Version:** 1.0.0  
**Status:** Active Development  
**Last Updated:** November 2025

### **Upcoming Features**

- [ ] Advanced analytics dashboard
- [ ] Bulk course enrollment
- [ ] Referral system
- [ ] Certificate generation
- [ ] Mobile app API support
- [ ] Multi-language support
- [ ] Advanced reporting
- [ ] Real-time notifications via WebSocket
- [ ] Advanced search and filters

---

**Made with ❤️ by Logical Minds IT Solutions**
