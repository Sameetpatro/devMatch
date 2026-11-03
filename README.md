# DevMatch — High-Throughput Developer & Recruiter Matching Platform

> An event-driven, full-stack talent discovery and hiring platform featuring recruiter role publishing, developer discovery feeds with automated compatibility scoring, instant collaboration requests, real-time WebSockets notifications & chat, candidate application tracking with a 3-day TTL, Redis caching & presence management, asynchronous RabbitMQ worker queues, and concurrency-hardened PostgreSQL transactions.

---

## Architecture Overview

```mermaid
flowchart TD
    subgraph Clients["Clients"]
        WebClient["React 19 Web App (Vite + Tailwind)"]
        MobileClient["React Native Android App (Expo)"]
    end

    subgraph API_Gateway["Express REST & WebSocket Server"]
        MW["Middleware (Auth JWT, Zod Validation, Redis Rate Limiting)"]
        WS["Socket.io WebSocket Engine (Real-time Notifications, Chat & Presence)"]
        Controllers["Controllers (Auth, Roles, Swipes, Matches, Chat, Notifications)"]
        Services["Service Layer (Business Logic, Compatibility Scoring & Dispatch)"]
        Repositories["Repository Layer (Prisma Data Access & Deduplication)"]
    end

    subgraph Storage["Data & Cache Layer"]
        Postgres[("Neon PostgreSQL\n(Direct TCP, Advisory Locks, Composite Uniqueness, Interactive Transactions)")]
        Redis[("Redis\n(Feed Caching, Rate Limiting, User Presence TTL)")]
    end

    subgraph Messaging["Asynchronous Queues & Background Workers"]
        RabbitMQ[("RabbitMQ Message Broker (amqplib)")]
        subgraph Workers["Decoupled Background Workers"]
        MatchWorker["Candidate Matching Worker\n(Precomputes Scores & Warms Cache)"]
        NotifWorker["Notification Worker\n(In-App Alerts Queue Consumer)"]
        EmailWorker["Email Processing Worker\n(Nodemailer Async Delivery)"]
        end
    end

    WebClient & MobileClient -->|HTTP REST| MW
    WebClient & MobileClient <-->|WebSockets| WS
    MW --> Controllers
    Controllers --> Services
    Services --> Repositories
    Repositories --> Postgres

    Services <-->|Feed Cache & Invalidation| Redis
    MW <-->|Sliding Window Rate Limit| Redis
    WS <-->|Presence Heartbeats (60s TTL)| Redis

    Services -->|Synchronous Direct DB Save & WS Push| WS
    Services -->|Publish Events (Async Backup)| RabbitMQ
    RabbitMQ --> Workers
    Workers --> Postgres
```

---

## Key Features & Highlights

### 1. Dual User Personas (Recruiters & Developers)
- **Recruiter Persona**: Post technical roles with required skill tags, experience thresholds, and salary ranges. Search and filter candidates by skills/roles, swipe right to send collaboration requests, review applicants scored by compatibility algorithms, and accept or reject applications with atomic match creation.
- **Developer Persona**: Discover matching job opportunities ranked via skill overlap, rating, and experience weights. Apply directly with custom cover notes, track active applications with a 3-day review TTL, discover peer collaborators, and manage inbound connection requests.

### 2. Instant Collaboration & Connection Requests
- **Recruiter-to-Candidate Collaboration**: Recruiters can browse developers on `/swipe` and send a connection request with a single right-swipe or heart tap.
- **Direct Synchronous Notification Delivery**: Connection requests write directly to PostgreSQL in the request path and emit an immediate WebSocket event (`new_notification`), notifying the recipient instantaneously without polling delays or worker dependency.
- **Built-in 30s Deduplication**: Notifications employ an in-database 30-second deduplication guard to ensure neither duplicate clicks nor background queue workers create redundant alerts.
- **One-Click "Accept & Connect"**: Candidates can accept collaboration requests directly from their notification bell dropdown or via **Connections & Chat** $\rightarrow$ **Collaboration Requests Received** (`/connections`).
- **Atomic Reciprocal Matching**: When accepted, a mutual `Match` is atomically created inside an advisory-locked PostgreSQL transaction, connection notifications are issued to both parties, and live chat is unlocked immediately.

### 3. Candidate Application Tracking & 3-Day Review TTL
- **My Applications Dashboard (`/applications`)**: Candidates have a dedicated view to track every role they've applied for, with real-time status indicators:
  - `Under Review`: Features an active countdown clock indicating the 3-day recruiter review TTL.
  - `Accepted • Connected`: Displays an active connection badge with a direct **"Start Live Chat"** button.
  - `Not Selected`: Transparently reflects rejections when a recruiter decides not to proceed.
- **Recruiter Application Management (`/recruiter`)**: Recruiters review applicant pools for each open role with compatibility scores, view applicant resumes/profiles, and click **"Accept Candidate"** or **"Reject"** with instant candidate notification.

### 4. Interactive In-App Notification Center
- **Persistent Header Bell**: Positioned in the global navigation bar, displaying an animated unread badge counter.
- **Real-Time WebSocket Push**: Listens for `new_notification` and `new_match` events to trigger instant toast notifications and update the list dynamically.
- **Actionable Notification Cards**:
  - Collaboration requests feature inline **"Accept & Connect"** and **"Decline"** buttons.
  - Match connections include a direct **"Start Live Chat"** action button.
- **Spam-Free Experience**: Personalized exclusively to authentic job applications, status updates, and peer collaboration requests.

### 5. WebSockets Real-Time Chat Engine (`ChatModal`)
- Mounted directly on the HTTP server using `socket.io`.
- Token-authenticated handshake verifying JWT claims before joining rooms.
- **Room Isolation (`match_<matchId>`)**: Restricted strictly to authorized match participants.
- **Chat Experience**: Real-time message exchange, typing indicators (`typing_start`, `typing_stop`), message read receipts (`mark_read`), and auto-scrolling message streams.

### 6. Redis In-Memory Performance & Presence
- **Feed Caching with Non-Blocking Invalidation**: Discovery feeds are cached in Redis (`feed:dev:<id>`, `feed:role:<id>`) with 5-minute TTL. Mutating actions (publishing roles, applying, profile edits) trigger background pattern invalidations (`feed:*`).
- **User Presence Engine**: Heartbeat mechanism tracks active online sessions using Redis keys `presence:user:<id>` with a 60-second sliding TTL. Pipelined batch queries (`getUsersPresence`) allow sub-millisecond status lookups for entire connection lists.
- **Sliding Window Rate Limiting**: Redis-backed rate limiters (`rate-limit-redis`) guard critical auth (`30 req/15min`) and action (`40 req/1min`) endpoints against burst abuse.

### 7. RabbitMQ Event-Driven Background Workers
Heavy background operations are decoupled from the synchronous HTTP request path:
- **`devmatch.candidate_matching`**: Pre-computes candidate-job compatibility scores and warms the Redis feed cache upon role creation.
- **`devmatch.notifications`**: Provides asynchronous queue durability for notification dispatch.
- **`devmatch.email_processing`**: Sends transactional notifications (welcome emails, new applicant alerts, connection notices) via Nodemailer with preview URLs in development.

### 8. Concurrency Hardening & High-Throughput Database Optimizations
- **PostgreSQL Interactive Transactions**: Atomic multi-row mutations executed within `prisma.$transaction`.
- **Advisory Transaction Locking**: Reciprocal swipe actions acquire a transaction-scoped advisory lock on canonical user pairs (`SELECT pg_advisory_xact_lock(minId, maxId)`), eliminating race conditions during simultaneous mutual swipes.
- **Composite Uniqueness Invariants**:
  - `@@unique([jobRoleId, developerId])`: Enforces idempotency for concurrent application bursts (double-tap / replay attacks).
  - `@@unique([userAId, userBId])`: Canonical ordering (`userAId < userBId`) guarantees zero duplicate match rows.
- **Direct Neon TCP Connection**: Configured with direct host endpoints (bypassing pooler proxy timeouts) to eliminate `Error { kind: Closed, cause: None }` connection drops.
- **Optimized Lean Queries**: Streamlined data fetching without heavy nested joins, keeping application submissions fast (< 1.8s on remote databases).

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Backend Framework** | Node.js + Express 4 | REST APIs, route-level middleware, centralized error handling |
| **ORM & Database** | Prisma 5 + PostgreSQL (Neon) | Relational persistence, advisory locks, composite unique constraints |
| **In-Memory Cache** | Redis 7 (`ioredis`) | Feed caching, rate limiting, user presence TTL |
| **Message Broker** | RabbitMQ 3 (`amqplib`) | Async queues for matching, notifications, and emails |
| **Real-Time Layer** | Socket.io 4 | Authenticated WebSocket connections, room chat, typing indicators, live alerts |
| **Validation & Auth** | Zod + JWT + Bcryptjs | Strict request schemas, stateless Bearer tokens, password hashing |
| **Email Worker** | Nodemailer | Asynchronous email dispatch with Ethereal preview URLs |
| **Testing** | Jest + Supertest | Automated concurrency and race condition regression tests |
| **Web Client** | React 19 + Vite + Tailwind CSS | Recruiter dashboard, developer feed, applications tracking, live chat modal |
| **Mobile Client** | React Native (Expo) | Android/iOS mobile client with feed & real-time chat |

---

## Project Structure

```
devMatch/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma             # 8 models (User, JobRole, RoleSkill, Application, Match, Message, Notification, Skill)
│   │   ├── seed_devmatch.js          # Database seeder (50 jobs, 20 recruiters, 40 candidates)
│   │   └── reset_test_ids.js         # Dedicated reset script for test1 and test2 accounts
│   ├── scripts/
│   │   ├── reproduce-race-condition.js# Live tracing script proving concurrency safeguards
│   │   ├── test-phase2.js            # REST API verification (Recruiter role publish & apply)
│   │   ├── test-phase3.js            # Redis caching, invalidation & presence verification
│   │   ├── test-phase4.js            # RabbitMQ worker queue verification
│   │   └── test-phase5.js            # WebSockets real-time chat verification
│   ├── test-direct-notification-flow.js # End-to-end direct notification & chat verification
│   ├── src/
│   │   ├── config/                   # env, prisma (direct TCP), redis singleton configurations
│   │   ├── controllers/              # auth, developer, match, role, swipe controllers
│   │   ├── middlewares/              # auth, rateLimiter, validate, errorHandler
│   │   ├── queues/                   # RabbitMQ connection manager & event publishers
│   │   ├── repositories/             # Data access layer (user, role, application, match, swipe, notification)
│   │   ├── routes/                   # REST route definitions & Zod schemas
│   │   ├── services/                 # Business logic, scoring, presence, cache, swipe, role services
│   │   ├── sockets/                  # Socket.io chat & direct real-time notification engine
│   │   ├── workers/                  # RabbitMQ consumers (matching, notification, email)
│   │   ├── app.js                    # Express app configuration
│   │   └── server.js                 # HTTP server + Socket.io + background workers
│   └── tests/
│       └── concurrency.test.js       # Automated Jest concurrency regression test suite
│
├── frontend/                         # React 19 Web Client (Vite + Tailwind CSS)
│   ├── src/
│   │   ├── components/               # NotificationCenter, ChatModal, DevCard, Layout, MatchPopup, etc.
│   │   ├── lib/                      # api.js (Axios), auth.jsx (AuthContext), socket.js (Socket.io client)
│   │   └── pages/                    # RecruiterDashboard, RolesFeed, MyApplications, Connections, Swipe, Auth
│   └── vite.config.js
│
├── mobile/                           # React Native Android/iOS Mobile Client
│   ├── src/
│   │   ├── screens/                  # AuthScreen, FeedScreen, MatchesScreen, ChatScreen
│   │   ├── services/                 # api.js (Axios), socket.js (Socket.io)
│   │   └── config.js                 # API & WebSocket endpoints configuration
│   ├── App.js                        # Mobile navigation shell & real-time state
│   └── app.json                      # Expo application manifest
│
└── docker-compose.yml                # Redis & RabbitMQ container orchestration
```

---

## Local Setup & Quickstart

### Prerequisites
- **Node.js**: `v18+` or `v20+`
- **Docker & Docker Compose**: For local Redis and RabbitMQ services
- **PostgreSQL**: Neon cloud instance or local PostgreSQL

### 1. Start Infrastructure Services
Start Redis and RabbitMQ with Docker Compose:
```bash
docker compose up -d
```
Verify containers are healthy:
- Redis: `localhost:6379`
- RabbitMQ: `localhost:5672` (Management Dashboard: `http://localhost:15672`, credentials: `guest` / `guest`)

### 2. Backend Setup
```bash
cd backend
npm install

# Copy environment template if not present
cp .env.example .env
```
Ensure `backend/.env` contains your PostgreSQL connection string and local services:
```env
PORT=5001
NODE_ENV=development
CLIENT_ORIGIN="http://localhost:5173,http://localhost:5174"
DATABASE_URL="postgresql://user:password@host/neondb?sslmode=require"
JWT_SECRET="your-secure-jwt-secret"
JWT_EXPIRES_IN="7d"
REDIS_URL="redis://localhost:6379"
RABBITMQ_URL="amqp://guest:guest@localhost:5672"
EMAIL_FROM="DevMatch <noreply@devmatch.io>"
```

Sync schema and seed initial data:
```bash
npx prisma db push

# Optional: Seed 50 jobs, 20 recruiters, and 40 candidates
node prisma/seed_devmatch.js

# Start backend server
npm run dev
```
*The server starts on `http://localhost:5001` with Socket.io enabled and RabbitMQ consumers active.*

### 3. Frontend Web Setup
In a new terminal:
```bash
cd frontend
npm install --legacy-peer-deps
npm run dev
```
*Open `http://localhost:5173` in your browser.*

### 4. Mobile Client Setup (React Native / Expo)
In a new terminal:
```bash
cd mobile
npm install
npx expo start
```
*Press `a` to run on an Android emulator or scan the QR code using the Expo Go mobile app.*

---

## Pre-Seeded Test Accounts

The database comes pre-seeded with 50 jobs, 20 recruiters, and 40 developers, including two designated test accounts:

| Persona | Email | Password | Role / Details |
|---|---|---|---|
| **Candidate** | `test1@candidate.com` | `password123` | **Kenji Sato**: Rust, Tokio, WebAssembly, PostgreSQL |
| **Recruiter** | `test2@recruiter.com` | `password123` | **Alex Rivera** (*Rust Systems Corp*): Rust Systems Lead opening |

To reset test accounts at any time without wiping other data:
```bash
cd backend
node prisma/reset_test_ids.js
```

---

## Testing & Verification

### 1. Direct Notification & Connection Workflow
Simulates a recruiter sending a connection request, verifies instant direct DB notification persistence, tests candidate acceptance, mutual match creation, and real-time chat messaging:
```bash
cd backend
node test-direct-notification-flow.js
```

### 2. Concurrency & Race Condition Suite
Verifies database-level safeguards (PostgreSQL advisory transaction locks and unique constraints):
```bash
cd backend

# Run the live race condition tracing script
npm run test:concurrency

# Run automated Jest regression tests
npm test
```

### 3. Layer-by-Layer Verification Scripts
```bash
cd backend

# Phase 2: Role publishing, feed scoring & candidate applications
node scripts/test-phase2.js

# Phase 3: Redis caching (sub-ms hits), invalidation & user presence pipeline
node scripts/test-phase3.js

# Phase 4: RabbitMQ async queues (candidate matching, in-app notifications, email)
node scripts/test-phase4.js

# Phase 5: WebSockets handshake auth, room messaging & typing indicators
node scripts/test-phase5.js
```

---

## API Reference Summary

### Authentication (`/api/auth`)
- `POST /register`: Register user with persona (`DEVELOPER` or `RECRUITER`), skills, and contact details.
- `POST /login`: Authenticate and receive signed JWT.
- `GET /me`: Fetch authenticated user profile.

### Roles & Recruitment (`/api/roles`)
- `POST /`: *(Recruiter)* Publish new role with required skills, experience, and salary range.
- `GET /`: *(Recruiter)* List all roles posted by current recruiter.
- `GET /feed`: *(Developer)* Discover personalized job feed scored by compatibility formula.
- `POST /:id/apply`: *(Developer)* Submit application for a job role (direct recruiter notification).
- `GET /:id/candidates`: *(Recruiter)* View ranked applicants with compatibility scores.
- `POST /:id/applications/:appId/decision`: *(Recruiter)* Accept (`MATCHED`) or reject applicant.

### Candidate Applications (`/api/applications`)
- `GET /my`: *(Developer)* List all submitted applications with statuses (`PENDING`, `ACCEPTED`, `REJECTED`) and 3-day review TTL countdown.

### Swipes & Collaboration Requests (`/api/swipes`)
- `POST /`: Send swipe / connection request (`direction: 'LIKE'` or `'PASS'`). Direct DB notification + WebSocket event emitted.
- `GET /received`: List inbound collaboration requests received with connection statuses.
- `GET /sent`: List outbound connection requests sent.

### Notifications (`/api/notifications`)
- `GET /`: List notifications for current user with unread filter.
- `PATCH /:id/read`: Mark single notification as read.
- `POST /read-all`: Mark all notifications as read.

### Real-Time Chat & Matches (`/api/matches`)
- `GET /`: List all mutual matches with unlocked contact information and presence statuses.
- `GET /:id/messages`: Paginated message history for a match.
- `POST /:id/messages`: Send chat message (persists in DB and emits via Socket.io).

### Presence & Health (`/api/presence`, `/health`)
- `POST /presence/heartbeat`: Keep-alive heartbeat renewing Redis presence TTL (60s).
- `GET /presence/:userId`: Check single user online status.
- `POST /presence/batch`: Batch check online statuses for an array of user IDs.
- `GET /health`: System health status endpoint.

---

## License

MIT License — Built by **Sameet Patro**.
