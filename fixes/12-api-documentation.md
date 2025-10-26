# Master-AI API Documentation

## Overview
The Master-AI platform provides a comprehensive REST API for managing AI education content, user progress, and subscriptions.

## Base URL
```
Production: https://api.master-ai.com
Development: http://localhost:3000/api
```

## Authentication
All authenticated endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <token>
```

## Rate Limiting
- Authentication endpoints: 5 requests per 15 minutes
- API endpoints: 100 requests per 15 minutes
- Strict endpoints: 10 requests per hour

Rate limit headers:
- `X-RateLimit-Limit`: Request limit
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Reset timestamp

## Endpoints

### Authentication

#### POST /api/auth/signup
Create a new user account.

**Request Body:**
```json
{
  "name": "string",
  "email": "string",
  "password": "string",
  "confirmPassword": "string",
  "subscriptionTier": "free|pro|team|enterprise",
  "acceptTerms": true,
  "acceptPrivacy": true
}
```

**Response (201):**
```json
{
  "message": "Account created successfully",
  "user": {
    "id": "string",
    "name": "string",
    "email": "string",
    "subscriptionTier": "string",
    "createdAt": "datetime"
  }
}
```

#### POST /api/auth/signin
Sign in to existing account.

**Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response (200):**
```json
{
  "token": "string",
  "user": {
    "id": "string",
    "email": "string",
    "name": "string",
    "role": "string"
  }
}
```

#### POST /api/auth/forgot-password
Request password reset.

**Request Body:**
```json
{
  "email": "string"
}
```

**Response (200):**
```json
{
  "message": "Password reset email sent"
}
```

### Lessons

#### GET /api/lessons
Get paginated list of lessons.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20)
- `tools` (string[]): Filter by tools
- `difficulty` (string): Filter by difficulty
- `learningPathId` (string): Filter by learning path

**Response (200):**
```json
{
  "lessons": [
    {
      "id": "string",
      "lessonNumber": 1,
      "title": "string",
      "description": "string",
      "difficultyLevel": "beginner|intermediate|advanced",
      "estimatedTime": 30,
      "tools": ["ChatGPT", "Claude"],
      "isFree": false,
      "videoUrl": "string",
      "learningPath": {
        "id": "string",
        "name": "string",
        "slug": "string"
      }
    }
  ],
  "total": 88,
  "page": 1,
  "totalPages": 5
}
```

#### GET /api/lessons/:id
Get single lesson details.

**Response (200):**
```json
{
  "id": "string",
  "lessonNumber": 1,
  "title": "string",
  "description": "string",
  "content": "string",
  "htmlContent": "string",
  "difficultyLevel": "string",
  "estimatedTime": 30,
  "tools": ["string"],
  "exercises": [],
  "resources": []
}
```

### User Progress

#### GET /api/progress
Get user's learning progress.

**Response (200):**
```json
{
  "progress": [
    {
      "lessonId": "string",
      "progressPercentage": 75,
      "completed": false,
      "completedAt": null,
      "lastAccessedAt": "datetime",
      "lesson": {
        "title": "string",
        "lessonNumber": 1
      }
    }
  ],
  "stats": {
    "totalLessons": 88,
    "completedLessons": 45,
    "inProgressLessons": 10,
    "totalTime": 1200
  }
}
```

#### POST /api/progress
Update lesson progress.

**Request Body:**
```json
{
  "lessonId": "string",
  "progressPercentage": 75,
  "completed": false
}
```

**Response (200):**
```json
{
  "id": "string",
  "lessonId": "string",
  "progressPercentage": 75,
  "completed": false,
  "updatedAt": "datetime"
}
```

### Subscriptions

#### GET /api/subscriptions/current
Get current subscription details.

**Response (200):**
```json
{
  "subscription": {
    "tier": "pro",
    "status": "active",
    "currentPeriodEnd": "datetime",
    "cancelAtPeriodEnd": false,
    "features": {
      "maxLessons": -1,
      "certificatesEnabled": true,
      "teamMembers": 5
    }
  }
}
```

#### POST /api/subscriptions/upgrade
Upgrade subscription tier.

**Request Body:**
```json
{
  "tier": "pro|team|enterprise",
  "billingInterval": "month|year"
}
```

**Response (200):**
```json
{
  "subscription": {
    "id": "string",
    "tier": "pro",
    "status": "active"
  },
  "checkoutUrl": "string"
}
```

### Achievements

#### GET /api/achievements
Get user achievements.

**Response (200):**
```json
{
  "achievements": [
    {
      "id": "string",
      "name": "Fast Learner",
      "description": "Complete 5 lessons in one day",
      "icon": "🚀",
      "unlockedAt": "datetime",
      "progress": {
        "current": 5,
        "target": 5
      }
    }
  ],
  "stats": {
    "total": 50,
    "unlocked": 25,
    "points": 2500
  }
}
```

### Admin Endpoints

#### GET /api/admin/stats
Get platform statistics (Admin only).

**Response (200):**
```json
{
  "users": {
    "total": 1000,
    "active": 750,
    "new": 50
  },
  "lessons": {
    "total": 88,
    "averageCompletion": 65.5
  },
  "revenue": {
    "mrr": 25000,
    "arr": 300000
  }
}
```

## Error Responses

All endpoints may return these error responses:

**400 Bad Request:**
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

**401 Unauthorized:**
```json
{
  "error": "Authentication required"
}
```

**403 Forbidden:**
```json
{
  "error": "Insufficient permissions"
}
```

**404 Not Found:**
```json
{
  "error": "Resource not found"
}
```

**429 Too Many Requests:**
```json
{
  "error": "Too many requests, please try again later"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Internal server error"
}
```

## Webhooks

### Stripe Webhooks
The platform listens for Stripe webhook events at:
```
POST /api/stripe/webhook
```

Events handled:
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

## SDKs

Official SDKs are available for:
- JavaScript/TypeScript
- Python
- Ruby
- PHP

Example (JavaScript):
```javascript
import { MasterAIClient } from '@master-ai/sdk';

const client = new MasterAIClient({
  apiKey: 'your-api-key',
  environment: 'production'
});

// Get lessons
const lessons = await client.lessons.list({
  page: 1,
  limit: 20,
  difficulty: 'beginner'
});

// Update progress
await client.progress.update({
  lessonId: 'lesson-123',
  progressPercentage: 100,
  completed: true
});
```

## Changelog

### v1.0.0 (2024-01-15)
- Initial API release
- Authentication endpoints
- Lesson management
- Progress tracking
- Subscription handling