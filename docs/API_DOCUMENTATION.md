# Master-AI API Documentation

## Overview

The Master-AI API provides a comprehensive set of endpoints for AI-powered operations. All API requests must be authenticated using JWT tokens unless otherwise specified.

## Base URL

```
Production: https://api.master-ai.com/v1
Development: http://localhost:3000/api/v1
```

## Authentication

### JWT Authentication

Most endpoints require a valid JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Obtaining a Token

```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "your-password"
}
```

Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "refresh-token-here",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "role": "user"
  }
}
```

### Refreshing Tokens

```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "your-refresh-token"
}
```

## Error Handling

All errors follow a consistent format:

```json
{
  "error": {
    "id": "error-uuid",
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "statusCode": 400,
    "details": {} // Optional additional information
  }
}
```

### Common Error Codes

- `BAD_REQUEST` (400): Invalid request parameters
- `UNAUTHORIZED` (401): Missing or invalid authentication
- `FORBIDDEN` (403): Insufficient permissions
- `NOT_FOUND` (404): Resource not found
- `VALIDATION_ERROR` (422): Request validation failed
- `RATE_LIMIT_EXCEEDED` (429): Too many requests
- `INTERNAL_ERROR` (500): Server error

## Rate Limiting

API requests are rate limited based on the endpoint:

- Authentication endpoints: 5 requests per 15 minutes
- Standard API endpoints: 100 requests per 15 minutes
- Premium users: 1000 requests per 15 minutes

Rate limit information is included in response headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## Endpoints

### Health Check

```http
GET /health
```

No authentication required. Returns server status.

Response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00Z",
  "version": "1.0.0",
  "services": {
    "database": "connected",
    "redis": "connected"
  }
}
```

### User Management

#### Get Current User

```http
GET /users/me
Authorization: Bearer <token>
```

Response:
```json
{
  "id": "user-id",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "user",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

#### Update User Profile

```http
PATCH /users/me
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Jane Doe",
  "preferences": {
    "theme": "dark",
    "notifications": true
  }
}
```

### AI Operations

#### Generate Text

```http
POST /ai/generate
Authorization: Bearer <token>
Content-Type: application/json

{
  "prompt": "Write a story about...",
  "model": "gpt-4",
  "maxTokens": 1000,
  "temperature": 0.7,
  "stream": false
}
```

Response:
```json
{
  "id": "generation-id",
  "text": "Generated text here...",
  "model": "gpt-4",
  "usage": {
    "promptTokens": 50,
    "completionTokens": 200,
    "totalTokens": 250
  },
  "createdAt": "2024-01-01T00:00:00Z"
}
```

#### Stream Generation

For streaming responses, set `stream: true`:

```http
POST /ai/generate
Authorization: Bearer <token>
Content-Type: application/json

{
  "prompt": "Tell me about...",
  "stream": true
}
```

Response will be Server-Sent Events:
```
data: {"chunk": "Once upon", "id": "gen-123"}
data: {"chunk": " a time", "id": "gen-123"}
data: {"done": true, "id": "gen-123"}
```

### File Operations

#### Upload File

```http
POST /files/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <binary-data>
purpose: "analysis"
```

Response:
```json
{
  "id": "file-id",
  "filename": "document.pdf",
  "size": 1024000,
  "mimeType": "application/pdf",
  "url": "/files/file-id",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

#### Get File

```http
GET /files/:fileId
Authorization: Bearer <token>
```

### Webhooks

#### Register Webhook

```http
POST /webhooks
Authorization: Bearer <token>
Content-Type: application/json

{
  "url": "https://your-site.com/webhook",
  "events": ["generation.completed", "file.processed"],
  "secret": "webhook-secret"
}
```

#### Webhook Events

Events are sent as POST requests with HMAC-SHA256 signature:

```http
POST https://your-site.com/webhook
X-Webhook-Signature: sha256=...
Content-Type: application/json

{
  "id": "event-id",
  "type": "generation.completed",
  "data": {
    "generationId": "gen-123",
    "status": "completed"
  },
  "createdAt": "2024-01-01T00:00:00Z"
}
```

## Pagination

List endpoints support pagination:

```http
GET /users?page=2&limit=20&sort=-createdAt
```

Parameters:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)
- `sort`: Sort field, prefix with `-` for descending

Response includes pagination metadata:
```json
{
  "data": [...],
  "pagination": {
    "page": 2,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

## CORS

CORS is enabled for configured origins. Include credentials for authenticated requests:

```javascript
fetch('https://api.master-ai.com/v1/users/me', {
  credentials: 'include',
  headers: {
    'Authorization': 'Bearer token'
  }
})
```

## SDK Examples

### JavaScript/TypeScript

```typescript
import { MasterAI } from '@master-ai/sdk';

const client = new MasterAI({
  apiKey: 'your-api-key',
  baseURL: 'https://api.master-ai.com/v1'
});

const response = await client.generate({
  prompt: 'Hello, world!',
  model: 'gpt-4'
});
```

### Python

```python
from master_ai import MasterAI

client = MasterAI(api_key="your-api-key")

response = client.generate(
    prompt="Hello, world!",
    model="gpt-4"
)
```

## Best Practices

1. **Always use HTTPS** in production
2. **Store tokens securely** - never in localStorage
3. **Implement retry logic** with exponential backoff
4. **Handle rate limits** gracefully
5. **Validate webhook signatures** for security
6. **Use appropriate timeouts** for long-running operations
7. **Implement proper error handling** for all API calls

## Support

For API support, contact: api-support@master-ai.com
