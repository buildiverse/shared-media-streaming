# Backend API Documentation

## Overview

The Shared Media Streaming backend is a Node.js/Express.js application built with a clean architecture pattern, providing RESTful HTTP APIs and real-time WebSocket communication for synchronized media streaming experiences.

## Architecture

### Clean Architecture Pattern

The backend follows a layered clean architecture approach:

```
┌─────────────────────────────────────┐
│           Interface Layer           │ ← HTTP Controllers, Socket Controllers
├─────────────────────────────────────┤
│         Application Layer           │ ← Use Cases, Business Logic
├─────────────────────────────────────┤
│           Domain Layer              │ ← Entities, Repositories, Services
├─────────────────────────────────────┤
│       Infrastructure Layer          │ ← Database, External Services
└─────────────────────────────────────┘
```

#### Layer Responsibilities

- **Interface Layer**: HTTP routes, controllers, socket handlers, validation, middleware
- **Application Layer**: Use cases that orchestrate business logic
- **Domain Layer**: Core business entities, repository interfaces, service interfaces
- **Infrastructure Layer**: Database implementations, external service integrations

### Technology Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Real-time**: Socket.IO
- **Authentication**: JWT (JSON Web Tokens)
- **File Storage**: AWS S3
- **Security**: Helmet, CORS, Rate Limiting, MongoDB Sanitization
- **Validation**: Zod schema validation
- **Testing**: Jest

## Authentication

### JWT Token System

The backend uses a dual-token authentication system:

- **Access Token**: Short-lived (15 minutes) for API requests
- **Refresh Token**: Long-lived for token renewal

#### Token Configuration

```env
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
```

#### Authentication Flow

1. **Login**: User provides credentials → receives access + refresh tokens
2. **API Requests**: Include `Authorization: Bearer <access_token>` header
3. **Token Refresh**: Use refresh token to get new access token
4. **Logout**: Invalidate refresh token

#### Protected Routes

All routes except the following require authentication:

- `POST /auth/login`
- `POST /auth/refresh-token`
- `GET /rooms/public`

## Rate Limiting

### HTTP Rate Limiting

- **Window**: 15 minutes
- **Max Requests**: 100 per IP address
- **Headers**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

### Socket Rate Limiting

- **Events per minute**: Configurable per event type
- **Connection limits**: Per IP address
- **Automatic disconnection**: On rate limit violation

## Logging

### Log Levels

- **INFO**: General application flow
- **WARN**: Potential issues
- **ERROR**: Errors that need attention
- **DEBUG**: Detailed debugging information

### Logged Information

- Request/response details
- User authentication events
- File upload operations
- Room creation/joining
- Socket connections/disconnections
- Error occurrences with stack traces

## File Storage

### S3 Integration

- **Bucket**: Configurable S3 bucket
- **Region**: Configurable AWS region
- **Access Control**: Private file access with signed URLs
- **File Types**: Video, audio, and image files
- **Metadata**: File information stored in MongoDB

### File Processing

- **Validation**: MIME type and size verification
- **Storage**: Direct upload to S3
- **Database**: Metadata stored in MongoDB
- **Access**: Signed URLs for secure file access

## Testing

### Test Structure

```
tests/
├── application/use-cases/
├── domain/entities/
├── infrastructure/
│   ├── db/mongoose/repositories/
│   └── services/
└── interface/
    ├── http/
    │   ├── controllers/
    │   └── middlewares/
    └── socket/controllers/
```

### Test Coverage

- Unit tests for use cases
- Entity validation tests
- Repository integration tests
- Controller endpoint tests
- Middleware functionality tests
- Socket event handling tests

## Deployment

### Environment Variables

```env
# Database
MONGODB_URI=mongodb://localhost:27017/shared-media-streaming

# JWT
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# AWS S3
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your_bucket_name

# Server
PORT=3000
NODE_ENV=development
```

### Docker Support

- **Backend Container**: Node.js application
- **MongoDB Container**: Database service
- **Docker Compose**: Multi-container orchestration

## Performance Considerations

### Database Optimization

- **Indexing**: Strategic database indexes for queries
- **Connection Pooling**: MongoDB connection management
- **Query Optimization**: Efficient database queries

### Caching Strategy

- **Memory Caching**: Room state and user sessions
- **Database Caching**: Frequently accessed data
- **CDN Integration**: Static file delivery

### Scalability

- **Horizontal Scaling**: Multiple application instances
- **Load Balancing**: Request distribution
- **Database Sharding**: Data distribution strategy
- **Microservices**: Potential service decomposition

## Monitoring and Health Checks

### Health Endpoints

- **API Status**: `/api/status`
- **Database Status**: `/api/status/mongo`
- **Service Health**: Overall system health

### Metrics

- Request/response times
- Error rates
- Database performance
- Socket connection counts
- File upload statistics

## API Versioning

Currently, the API is at version 1. Future versions will be implemented using URL versioning:

```
/api/v1/endpoint
/api/v2/endpoint
```

## Support and Documentation

For additional support or questions about the API:

- **Repository**: Check the main project repository
- **Issues**: Report bugs or feature requests
- **Documentation**: This document and inline code comments
- **Testing**: Run the test suite for examples of API usage

---

_Last updated: August 2025_
_API Version: 1.0_
