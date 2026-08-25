---
inclusion: auto
fileMatchPattern: '**/*'
---

# Worvia Backend - Professional Network Platform API

## Project Overview

Worvia is a **LinkedIn-style professional networking and recruitment platform**. This is the **backend API server** built with Express.js, TypeScript, and PostgreSQL (Neon).

The backend provides REST APIs and real-time WebSocket functionality for:
- User authentication and profile management
- Social feed (posts, comments, reactions)
- Job creation and application management
- Real-time messaging
- Event management
- Company profiles
- Notifications
- AI career tools integration

**Current Status:**
- Express.js + TypeScript running on http://localhost:5000
- PostgreSQL (Neon) database with Drizzle ORM
- Basic auth routes and user routes setup

## Core Responsibilities

### Authentication & Authorization
- User registration and login (JWT-based)
- Role-based access control (Professional, Recruiter, Company, Admin)
- Session management
- Password security with bcrypt

### User & Profile Management
- User account management
- Professional profile (skills, experience, education, certifications)
- Profile visibility controls
- Account settings

### Social Feed
- Post creation (general, job, event types)
- Comments and reactions (likes)
- Mentions with notifications
- Feed retrieval with pagination
- Post visibility controls

### Jobs & Recruitment
- Job creation by recruiters
- Job search and filtering
- Job applications
- Application status management (New → Reviewed → Shortlisted → Interview → Rejected/Hired)
- Recruiter applicant management dashboard

### Real-time Features (Socket.IO)
- Messaging (one-to-one conversations)
- Online/offline presence tracking
- Real-time notification delivery
- Live feed updates

### Events
- Event creation and management
- Event discovery
- RSVP management
- Event details and attendee tracking

### Connections & Following
- Connection requests and management
- Follow/unfollow relationships
- Suggested connections

### Notifications
- Event-based notifications
- Real-time delivery via WebSocket
- Notification center with read/unread status

### Companies
- Company profile management
- Recruiter-to-company associations
- Company job and event posts

## MVP Scope (Phase 1)

**Must Include:**
1. Authentication (JWT-based registration/login)
2. User profiles (professional summary, skills, experience)
3. Posts (create, retrieve, delete)
4. Comments and reactions
5. Basic notifications
6. Job creation and applications
7. Recruiter applicant management
8. One-to-one messaging (basic, can be enhanced with Socket.IO)
9. Connections (requests, accept, reject)
10. Basic error handling and validation

**Post-MVP (Later Phases):**
- Advanced feed ranking
- AI tools integration
- Event system
- Real-time presence
- Analytics
- Admin dashboard

## API Routes Overview

```
/api/v1/auth          - Authentication (register, login, logout)
/api/v1/users         - User profiles and account management
/api/v1/posts         - Social posts (create, read, update, delete)
/api/v1/comments      - Comments on posts
/api/v1/jobs          - Job management and discovery
/api/v1/applications  - Job applications
/api/v1/connections   - Connection management
/api/v1/messages      - Messaging
/api/v1/notifications - Notifications
/api/v1/events        - Events
/api/v1/companies     - Company profiles
```

## Database Schema

### Core Tables

**users** - Authentication and account data
- id, email, password_hash, created_at, updated_at, role

**profiles** - Professional profile information
- id, user_id, headline, summary, location, skills[], experience[], education[], certifications[]

**posts** - Social feed content
- id, user_id, type (general/job/event), content, job_id, event_id, visibility, created_at

**comments** - Post comments
- id, post_id, user_id, content, created_at

**post_reactions** - Likes/reactions on posts
- id, post_id, user_id, reaction_type, created_at

**jobs** - Job postings
- id, company_id, recruiter_id, title, description, location, salary_min, salary_max, skills[], deadline

**applications** - Job applications
- id, job_id, applicant_id, resume_url, cover_letter, status, created_at

**connections** - User connections
- id, sender_id, receiver_id, status (pending/connected), created_at

**follows** - Following relationships
- id, follower_id, followed_id, created_at

**messages** - Direct messages
- id, conversation_id, sender_id, content, read, created_at

**conversations** - Message threads
- id, created_at, updated_at

**events** - Events
- id, organizer_id, title, description, date, location, created_at

**notifications** - Notifications
- id, recipient_id, type, actor_id, reference_id, read, created_at

**companies** - Company profiles
- id, name, logo_url, industry, website, location, description

**company_recruiters** - Recruiter-company associations
- id, company_id, recruiter_id, role

## Module Structure

```
src/
├── config/env.ts              - Environment variables
├── db/
│   ├── index.ts              - Database connection
│   └── schema.ts             - Drizzle ORM schema
├── middleware/
│   ├── auth.middleware.ts
│   ├── error.middleware.ts
│   └── validation.middleware.ts
├── modules/
│   ├── auth/                 - Authentication
│   ├── users/                - User profiles
│   ├── posts/                - Social posts
│   ├── comments/             - Post comments
│   ├── jobs/                 - Job management
│   ├── applications/         - Job applications
│   ├── connections/          - Connections
│   ├── messages/             - Messaging
│   ├── notifications/        - Notifications
│   ├── events/               - Events
│   └── companies/            - Company profiles
├── routes/index.ts           - Route aggregator
├── utils/                    - Helpers and utilities
├── app.ts                    - Express app setup
└── server.ts                 - Server entry point
```

## Technology Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js 5.x with TypeScript
- **Database**: PostgreSQL (Neon Serverless)
- **ORM**: Drizzle ORM
- **Authentication**: JWT tokens
- **Validation**: Zod
- **Real-time**: Socket.IO (future enhancement)
- **File Storage**: Cloudinary
- **API Port**: 5000

## Key Development Patterns

### Service Layer
```
Request → Route → Controller → Service → Database
```

### Error Handling
- Custom `AppError` class for consistent error responses
- Global error middleware
- Proper HTTP status codes

### Input Validation
- Zod schemas for request body validation
- Middleware-based validation
- Detailed error messages

### Authentication
- JWT tokens in Authorization header
- Protected routes with auth middleware
- Role-based access control

## Running the Server

```bash
# Development (with file watching)
npm run dev

# Production build
npm run build

# Start production server
npm start

# Database migrations
npm run db:generate   # Generate migrations
npm run db:push       # Apply migrations
```

## Environment Variables

```
DATABASE_URL=postgresql://user:password@host:port/database
JWT_SECRET=your-secret-key
JWT_EXPIRE=24h
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

## Important Development Principles

1. **Service Layer Pattern** - Business logic in services, not controllers
2. **Type Safety** - Full TypeScript coverage, no `any` types
3. **Error Handling** - Consistent error responses with proper codes
4. **Input Validation** - Validate all user inputs before processing
5. **Database Efficiency** - Use proper joins, avoid N+1 queries
6. **API Conventions** - RESTful endpoints with standard HTTP methods
7. **Authentication First** - Implement auth before other features
8. **Modular Architecture** - Each module should be independently testable

## Current Implementation Status

### Completed
- ✅ Project structure setup
- ✅ Database connection (Drizzle ORM)
- ✅ Auth routes scaffold
- ✅ User routes scaffold
- ✅ Error middleware

### In Progress / Next Steps
- [ ] Complete auth module (login, registration, token refresh)
- [ ] Complete user module (profile CRUD, search)
- [ ] Password hashing and security
- [ ] Implement posts module
- [ ] Implement comments and reactions
- [ ] Implement connections system
- [ ] Implement jobs and applications
- [ ] Add messaging (basic then Socket.IO)
- [ ] Add notifications
- [ ] Add events
- [ ] Add company profiles

## Reference

- **Product Requirements**: See SRS document
- **Frontend**: `/worvia/` (Next.js 16)
- **Backend**: `/worvia-server/` (Express)
- **Database**: PostgreSQL via Neon

## Living Document Rule

This project evolves with requirements. Before implementing new features:
1. Add to appropriate module
2. Design data model
3. Define API routes
4. Plan implementation
5. Execute with clear commit messages

Avoid scope creep - stick to MVP definition unless explicitly approved.
