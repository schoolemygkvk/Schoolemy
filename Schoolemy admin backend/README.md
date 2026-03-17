# Schoolemy Admin Backend

🎓 Educational platform backend with AWS Lambda deployment and unlimited file upload capabilities.

## 🚀 Live Deployment

**API Gateway URL**: `https://w4jpp7oi02.execute-api.ap-south-1.amazonaws.com/dev`  
**Status**: ✅ LIVE & OPERATIONAL  
**Last Deployed**: January 27, 2026

## 📦 Features

- ✅ **AWS Lambda Serverless** - Auto-scaling, pay-per-use
- ✅ **Unlimited File Uploads** - Direct S3 upload via presigned URLs
- ✅ **Multipart Upload Support** - Files > 5GB supported
- ✅ **UTF-8 Filenames** - Tamil, Hindi, and all languages
- ✅ **Course Management** - Complete CRUD operations
- ✅ **User Authentication** - JWT-based security
- ✅ **Real-time Updates** - Socket.io integration
- ✅ **MongoDB Atlas** - Cloud database
- ✅ **API Gateway Integration** - Production-ready REST API

## 🏗️ Architecture

```
Frontend → API Gateway → Lambda Function → MongoDB Atlas
                    ↓
                  AWS S3 (Direct Upload)
```

## 📚 Documentation

- **[DEPLOYMENT_SUCCESS.md](./DEPLOYMENT_SUCCESS.md)** - Current deployment details
- **[LAMBDA_DEPLOYMENT.md](./LAMBDA_DEPLOYMENT.md)** - Full deployment guide
- **[LARGE_FILE_UPLOAD_GUIDE.md](./LARGE_FILE_UPLOAD_GUIDE.md)** - S3 upload implementation
- **[QUICK_START_LARGE_FILES.md](./QUICK_START_LARGE_FILES.md)** - Quick reference

## 🛠️ Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build Lambda package
npm run build:lambda

# Deploy to AWS Lambda
npm run deploy
```

## 🌐 API Endpoints

### Public Routes

- `POST /adminlogin` - Admin authentication
- `POST /verify-otp` - OTP verification
- `GET /api/blog/*` - Blog routes

### Protected Routes (Requires JWT)

- `GET /getcoursesname` - Get all course names
- `GET /courses/:coursename` - Get course details
- `POST /createcourses` - Create new course
- `PUT /course/update/:coursename` - Update course
- `PUT /course/update-with-urls/:coursename` - Update with S3 URLs
- `DELETE /course/delete/:coursename` - Delete course

### S3 Upload Routes (Protected)

- `POST /api/s3/presigned-urls` - Get presigned URLs (< 5GB)
- `POST /api/s3/validate-uploads` - Validate S3 uploads
- `POST /api/s3/multipart/initialize` - Start multipart upload
- `POST /api/s3/multipart/complete` - Complete multipart upload
- `POST /api/s3/multipart/abort` - Abort multipart upload

## 🔐 Authentication

All protected endpoints require JWT token in Authorization header:

```bash
Authorization: Bearer YOUR_JWT_TOKEN
```

Get token by calling `/adminlogin` endpoint.

## 📝 Environment Variables

Required environment variables (configured in `lambda-env.json` for Lambda):

```env
MONGO_URL=mongodb+srv://...
JWT_SECRET=your-secret
AWS_S3_BUCKET_SCHOOLEMY=your-bucket
AWS_REGION=ap-south-1
S3_ACCESS_KEY_ID=your-key
S3_SECRET_ACCESS_KEY=your-secret
EMAIL_ADMIN=admin@example.com
EMAIL_PASS=app-specific-password
```

## 🚀 Deployment

### Quick Deploy

```powershell
npm run deploy
```

### Manual Deploy

```powershell
# Build package
node scripts/build-lambda.js

# Deploy with Terraform
cd terraform
terraform init
terraform plan
terraform apply
```

## 🧪 Testing

```bash
# Test login endpoint
curl -X POST "https://w4jpp7oi02.execute-api.ap-south-1.amazonaws.com/dev/adminlogin" \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email","password":"your-password"}'

# Test S3 presigned URL generation
curl -X POST "https://w4jpp7oi02.execute-api.ap-south-1.amazonaws.com/dev/s3/presigned-urls" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"files":[{"fileName":"test.mp4","fileType":"video/mp4","folder":"test","fileSize":1000000}]}'
```

## 📊 Project Structure

```
.
├── src/
│   ├── Controllers/      # Business logic
│   ├── Models/          # MongoDB schemas
│   ├── Routes/          # API routes
│   ├── Middleware/      # Auth & validation
│   └── DB/              # Database configuration
├── terraform/           # Infrastructure as Code
├── scripts/             # Build scripts
├── handler.js           # Lambda entry point
├── server.js            # Express server
└── deploy-lambda.ps1    # Deployment automation
```

## 🔧 Technology Stack

- **Runtime**: Node.js 20.x
- **Framework**: Express.js
- **Database**: MongoDB Atlas
- **Cloud**: AWS (Lambda, S3, API Gateway)
- **IaC**: Terraform
- **Authentication**: JWT
- **File Upload**: AWS S3 (Direct Upload)
- **Real-time**: Socket.io

## 📈 Performance

- **Cold Start**: ~1-2 seconds
- **Warm Start**: <100ms
- **File Upload**: Direct to S3 (no server load)
- **Auto-scaling**: Handles any number of concurrent requests

## 🆘 Troubleshooting

### "Content Too Large" Error

✅ **SOLVED** - Use S3 direct upload endpoints instead of traditional upload

### "Authorization header not found"

Add JWT token: `Authorization: Bearer YOUR_TOKEN`

### Lambda Cold Starts

First request after idle may be slower - this is normal

## 📄 License

Private - Schoolemy GKVK

## 👥 Team

Schoolemy Admin Development Team

---

**Need Help?** Check the documentation files or CloudWatch logs in AWS Console.
