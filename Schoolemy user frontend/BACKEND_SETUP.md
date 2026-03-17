# Backend Configuration Guide

## Current Issue

You are seeing 404 errors because the API endpoints are not available. The frontend is trying to connect to:

- **Base URL**: `http://localhost:8000` (configured in `src/service/api.js`)
- **Expected Endpoints**:
  - `GET /api/user-course-meets/user/{userId}/meets` - Get user's meets
  - `GET /api/user-course-meets/user/{userId}/meets/{meetId}` - Get specific meet details
  - `GET /api/user-course-meets/meets/{meetId}/validate/{userId}` - Validate access
  - `POST /api/user-course-meets/meets/{meetId}/join` - Join a meet
  - `POST /api/user-course-meets/meets/{meetId}/complete` - Complete a meet

## Solutions

### Option 1: Start the Backend Server

If you have a backend server for this project:

1. Navigate to your backend directory
2. Start the server on port 8000
3. Ensure the above endpoints are implemented

### Option 2: Update API Configuration

If your backend runs on a different port or URL:

1. Create a `.env` file in the root directory
2. Add: `REACT_APP_API_URL=http://localhost:YOUR_PORT`
3. Restart the React development server

### Option 3: Use the Fallback Mode (Current)

The frontend now includes fallback handling:

- ✅ Won't crash on 404 errors
- ✅ Shows helpful development messages
- ✅ Allows continued development without backend

## Backend Requirements

Your backend should implement the following API structure:

```
GET  /api/user-course-meets/user/:userId/meets
GET  /api/user-course-meets/user/:userId/meets/:meetId
GET  /api/user-course-meets/meets/:meetId/validate/:userId
POST /api/user-course-meets/meets/:meetId/join
POST /api/user-course-meets/meets/:meetId/complete
GET  /api/user-course-meets/user/:userId/history
```

## Environment Variables

Create a `.env` file with:

```
REACT_APP_API_URL=http://localhost:8000
REACT_APP_ADMIN_API_URL=https://your-admin-api.com
```

## Testing Backend Connection

You can use the debug utilities in `src/service/debugApi.js` to check backend connectivity.
