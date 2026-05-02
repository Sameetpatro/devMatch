# DevMatch

> A Web app for developers to find collaborators — search by role and skills, swipe through ranked candidates, and unlock contact details only when both parties agree to work together.

A full-stack project (React + Node + Postgres) built for the 6th semester FSD assignment.

---

## Table of contents

- [What is DevMatch?](#what-is-devmatch)
- [Features](#features)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [Folder structure](#folder-structure)
- [Local setup](#local-setup)
- [Environment variables](#environment-variables)
- [Database schema](#database-schema)
- [API reference](#api-reference)
- [Ranking algorithm](#ranking-algorithm)
- [Privacy model](#privacy-model)
- [Pages](#pages)
- [Deployment](#deployment)
- [Useful scripts](#useful-scripts)
- [Project status](#project-status)

---

## What is DevMatch?

Most "find a co-founder" tools are either job boards (one-sided) or generic networks (noisy).
DevMatch is built around one idea: **two developers who genuinely want to build together**.

- You **search** for the role you need ("Backend", "Android", etc.) plus optional skills
- The app shows you a **ranked feed** of matching developers (best skill overlap first)
- You **swipe right** to ask them to collaborate, or **left** to skip
- When both of you swipe right, contact details (phone, email, LinkedIn, GitHub, Telegram) **unlock instantly**
- Until then, no one can see anyone else's contact info — it stays private

The twist over a regular dating-app clone is the **ranking** (skill match + rating + experience), the **privacy boundary** (contact gated on mutual consent), and the **search-first flow** (you never see a generic stack — always filtered to who you need).

---

## Features

### Authentication & profile
- Email + password registration with bcrypt hashing
- JWT-based stateless auth (Bearer tokens, 7-day expiry)
- Optional contact links: LinkedIn, GitHub, Telegram (URLs validated)
- Required contact: phone number (lenient regex covering international formats)
- Skills as a free-form tag list, stored as a true many-to-many relation

### Search & discovery
- Search-first flow — landing on `/swipe` shows a hero with role + skills picker before any cards appear
- Quick-pick chips for popular roles (Frontend, Backend, Android, ML, …) and skills (React, Node, Postgres, …)
- Free-form role search — typing `"frontend"` matches `"Frontend Developer"`, `"FRONTEND"`, etc.

### Smart ranking
- Score formula `(skillMatch × 50) + (rating × 30) + (experience × 20)` — all factors normalized to 0–1 so total scores stay in the 0–100 range
- Reference skills are **explicit filter** if provided, otherwise fall back to **the user's own skills** (personalized feed)
- Tiebreakers: rating → experience → id

### Swipe & match flow
- `react-tinder-card`-powered drag-to-swipe gestures + clickable Skip / "Ask to collaborate" buttons
- Re-swipes are idempotent (no duplicate entries — uses `upsert`)
- Auto-match: when both users LIKE each other, a `Match` row is created in the same DB transaction as the second swipe
- Already-swiped candidates are excluded from future searches

### Privacy boundary (enforced server-side)
- `GET /api/developers` strips `email`, `phone`, `linkedin`, `github`, `telegram` from every response
- `GET /api/matches` returns the **other** user's full contact info — but only because a `Match` row links you
- `GET /api/auth/me` always returns your own complete profile

### UI / UX
- White + pink theme (`#fff5f7` → `#ec4899`)
- Responsive layout — desktop-first cards, mobile bottom-nav
- Toast notifications for swipes, errors, success
- "It's a connection!" celebration popup when a match auto-creates
- Marketing landing page at `/` for unauthenticated visitors with hero, features, "How it works" steps, and final CTA

---

## Tech stack

| Layer | Technology | Why |
|---|---|---|
| Frontend | **React 19** + Vite | Fast HMR, modern defaults |
| Styling | **Tailwind CSS v3** | Utility-first, custom `brand` (pink) palette |
| Routing | **React Router v6** | Declarative route guards |
| Forms / data | Native `useState` + Axios | No state-management library needed for this scale |
| Swipe gestures | **react-tinder-card** | Best-in-class card-deck drag library |
| Toasts | **react-hot-toast** | Tiny, themeable |
| Icons | **lucide-react** + custom SVGs | Generic icons from lucide; brand icons (Github, LinkedIn, Telegram) inlined as SVG components since lucide removed them in newer versions |
| Backend | **Node 18+** + **Express 4** | Battle-tested, minimal |
| ORM | **Prisma 5** | Type-safe queries, painless migrations |
| Database | **PostgreSQL** (hosted on **Neon**) | Serverless-friendly, free tier |
| Auth | **jsonwebtoken** + **bcryptjs** | Stateless JWT + pure-JS bcrypt (no native compile on Windows) |
| Validation | **Zod** | Schema-driven request validation, clean error messages |
| Security | helmet, cors | Standard headers + cross-origin policy |
| Logging | morgan | Request logs in dev |

---

## Architecture

```
┌──────────────────┐                    ┌────────────────────┐                   ┌──────────────┐
│  Browser (SPA)   │   HTTPS + JWT      │  Express API       │   Prisma TCP/SSL  │  Postgres    │
│                  │ ───────────────▶   │                    │ ───────────────▶  │  (Neon)      │
│  React + Vite    │                    │  Routes →          │                   │              │
│  Axios client    │ ◀───────────────   │  Controllers →     │ ◀───────────────  │  6 tables    │
│                  │   JSON responses   │  Services → Prisma │                   │              │
└──────────────────┘                    └────────────────────┘                   └──────────────┘
```

The backend is a clean three-layer stack:

- **Routes** (`src/routes/*.routes.js`) — wire HTTP verbs to validators + controllers
- **Controllers** (`src/controllers/*.js`) — thin handlers that turn `req`/`res` into service calls
- **Services** (`src/services/*.js`) — business logic (auth, ranking, swipe-with-match-creation). No Express imports here — they could be reused from a CLI or background job.

This keeps tests easy and complex logic (ranking, match creation, privacy stripping) isolated from HTTP plumbing.

---

## Folder structure

```
assignment/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma                  # 5 models, 2 enums (kept), indexes
│   │   └── migrations/                    # Versioned SQL — committed
│   ├── scripts/
│   │   ├── e2e.js                         # End-to-end smoke test
│   │   └── inspect.js                     # Quick DB inspector
│   ├── src/
│   │   ├── config/
│   │   │   ├── env.js                     # Loads + validates env vars (fail fast)
│   │   │   └── prisma.js                  # Singleton Prisma client
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   ├── developer.controller.js
│   │   │   ├── match.controller.js
│   │   │   └── swipe.controller.js
│   │   ├── middlewares/
│   │   │   ├── auth.js                    # requireAuth (JWT verifier)
│   │   │   ├── errorHandler.js            # Global Zod + Prisma error handler
│   │   │   └── validate.js                # Zod request validator factory
│   │   ├── routes/
│   │   │   ├── auth.routes.js + auth.schema.js
│   │   │   ├── developer.routes.js + developer.schema.js
│   │   │   ├── swipe.routes.js + swipe.schema.js
│   │   │   └── match.routes.js
│   │   ├── services/
│   │   │   ├── auth.service.js            # register, login, getMe, toPublicUser
│   │   │   ├── developer.service.js       # listDevelopers, computeScore (ranking)
│   │   │   ├── swipe.service.js           # recordSwipe (atomic match creation)
│   │   │   └── match.service.js           # listMatches (with full contact)
│   │   ├── utils/
│   │   │   ├── asyncHandler.js
│   │   │   ├── httpError.js
│   │   │   ├── jwt.js
│   │   │   └── password.js
│   │   ├── app.js                         # Express app — no listen()
│   │   └── server.js                      # listen() + graceful shutdown
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── public/
│   │   └── favicon.svg                    # Custom pink-heart logo
│   ├── src/
│   │   ├── components/
│   │   │   ├── DevCard.jsx                # Single swipe card design
│   │   │   ├── Layout.jsx                 # Authenticated app shell + nav
│   │   │   ├── Logo.jsx
│   │   │   ├── MatchPopup.jsx             # "You're connected!" celebration
│   │   │   ├── Spinner.jsx
│   │   │   └── icons.jsx                  # GithubIcon, LinkedinIcon, TelegramIcon (custom SVG)
│   │   ├── lib/
│   │   │   ├── api.js                     # Axios instance + JWT interceptor
│   │   │   ├── auth.jsx                   # AuthProvider context + useAuth hook
│   │   │   └── Protected.jsx              # Route guard
│   │   ├── pages/
│   │   │   ├── Landing.jsx                # Public marketing page
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx              # Profile + own contact + recent connections
│   │   │   ├── Swipe.jsx                  # Search-first hero → card stack
│   │   │   └── Connections.jsx            # Matched users with full contact reveal
│   │   ├── App.jsx                        # Router
│   │   ├── main.jsx                       # Entry — wraps AuthProvider + Toaster
│   │   └── index.css                      # Tailwind + theme tokens + component classes
│   ├── tailwind.config.js                 # Pink palette, gradients, animations
│   ├── vite.config.js                     # /api proxy → :5000 in dev
│   └── .env.example
│
├── .gitignore                             # Root — covers backend, frontend, IDE files
└── README.md                              # ← you are here
```

---

## Local setup

### Prerequisites

- Node.js **18 or newer**
- A PostgreSQL database — local install, Docker, or hosted (the project was developed against [Neon](https://neon.tech)'s free tier)
- Git

### 1. Clone and install

```powershell
git clone https://github.com/Sameetpatro/devMatch.git
cd devMatch

# Backend
cd backend
npm install
cp .env.example .env

# Frontend (in a new terminal)
cd ../frontend
npm install --legacy-peer-deps         # required: react-tinder-card peer-dep mismatch
cp .env.example .env
```

### 2. Edit `backend/.env`

```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"
JWT_SECRET="<generate a long random string>"
JWT_EXPIRES_IN="7d"
CLIENT_ORIGIN="http://localhost:5173"
```

Generate a strong JWT secret in PowerShell:
```powershell
[Convert]::ToBase64String((1..48 | ForEach-Object { Get-Random -Maximum 256 }))
```

### 3. Apply migrations + start

```powershell
# Inside backend/
npm run prisma:generate
npm run prisma:migrate -- --name init   # only the FIRST time on a fresh DB
npm run dev                              # nodemon, http://localhost:5000

# Inside frontend/ (other terminal)
npm run dev                              # Vite, http://localhost:5173
```

The frontend's Vite dev server proxies `/api/*` to `localhost:5000`, so there's no CORS dance in development.

### 4. Verify

- `http://localhost:5000/health` → `{ "status": "ok", ... }`
- `http://localhost:5173/` → marketing landing page
- Click **Get Started** → register → swipe

---

## Environment variables

### Backend

| Variable | Required | Default | Notes |
|---|:-:|---|---|
| `PORT` | no | `5000` | HTTP port |
| `NODE_ENV` | no | `development` | `production` enables tighter logging |
| `DATABASE_URL` | **yes** | — | Postgres connection string. Append `?sslmode=require` for Neon |
| `JWT_SECRET` | **yes** | — | Long random string. Treat like a password |
| `JWT_EXPIRES_IN` | no | `7d` | Standard ms / vercel-ms format |
| `CLIENT_ORIGIN` | no | `http://localhost:5173` | CORS allow-list. In prod, set to your Vercel URL |

`src/config/env.js` validates required vars on boot — if `DATABASE_URL` or `JWT_SECRET` is missing, the server refuses to start.

### Frontend

| Variable | Required | Default | Notes |
|---|:-:|---|---|
| `VITE_API_URL` | no | `/api` | Where Axios sends requests. In dev, `/api` works because Vite proxies. In prod, set to your full backend URL like `https://devmatch-backend.onrender.com/api` |

---

## Database schema

5 tables + 1 enum.

```
┌───────────────────────────────────────┐
│ User                                  │
├───────────────────────────────────────┤
│ id              int          PK       │
│ email           string       UNIQUE   │
│ passwordHash    string                │
│ name            string                │
│ role            string                │   <-- free-form, e.g. "Backend Systems"
│ bio             text?                 │
│ experienceYears int          0..60    │
│ rating          float        0..5     │
│ isAvailable     bool         true     │
│ phone           string       NOT NULL │   <-- contact (gated)
│ linkedin        string?               │
│ github          string?               │
│ telegram        string?               │
│ createdAt       datetime              │
│ updatedAt       datetime              │
│                                       │
│ idx(role), idx(isAvailable)           │
└───────────────────────────────────────┘
       ▲                ▲
       │ 1..N           │ 1..N
       │                │
┌──────┴──────┐  ┌──────┴──────────┐  ┌──────────────────┐
│ UserSkill   │  │ Swipe           │  │ Match            │
├─────────────┤  ├─────────────────┤  ├──────────────────┤
│ userId   PK │  │ id           PK │  │ id            PK │
│ skillId  PK │  │ fromUserId   FK │  │ userAId       FK │
│             │  │ toUserId     FK │  │ userBId       FK │   <-- userAId < userBId
│ FK(User)    │  │ direction       │  │ createdAt        │       (canonical pair)
│ FK(Skill)   │  │ createdAt       │  │                  │
│             │  │                 │  │ UNIQUE(A, B)     │
│             │  │ UNIQUE(from,to) │  │ idx(A), idx(B)   │
└─────────────┘  └─────────────────┘  └──────────────────┘
       ▲
       │ 1..N
┌──────┴───────┐
│ Skill        │
├──────────────┤
│ id        PK │
│ name      U  │
└──────────────┘

enum SwipeDirection { LIKE, PASS }
```

### Key invariants enforced by the schema

- A user can swipe on another user only **once** (unique `fromUserId, toUserId`). Re-swipes are upserts.
- A `Match` is stored only **once per pair** (`userAId < userBId` + unique constraint). Concurrent reciprocal-LIKE inserts can't create duplicates.
- `UserSkill` is a true M2M join with composite PK and `onDelete: Cascade` — deleting a user wipes their skill links.

---

## API reference

All authenticated endpoints expect `Authorization: Bearer <jwt>`.

### Auth

#### `POST /api/auth/register`
Public. Creates an account.

```json
// Request
{
  "email": "alice@example.com",
  "password": "secret123",
  "name": "Alice",
  "role": "Frontend Developer",
  "bio": "Loves building UIs",
  "experienceYears": 3,
  "skills": ["React", "TypeScript", "Tailwind"],
  "phone": "+91 98765 43210",
  "linkedin": "https://linkedin.com/in/alice",
  "github": "https://github.com/alice",
  "telegram": "@alice_dev"
}
```

```json
// 201 Created
{
  "user": { "id": 1, "email": "alice@example.com", "name": "Alice", "role": "Frontend Developer", "phone": "+91 98765 43210", ... },
  "token": "eyJhbGc..."
}
```

Validation rules: password ≥ 6 chars, valid email, phone matches `/^\+?[\d\s\-()]{7,30}$/`, optional URLs must parse, max 30 skills.

#### `POST /api/auth/login`
Public.

```json
// Request
{ "email": "alice@example.com", "password": "secret123" }
```

```json
// 200
{ "user": { ... }, "token": "..." }
```

Errors are intentionally generic (`"Invalid email or password"`) for both wrong-email and wrong-password — never reveal which.

#### `GET /api/auth/me`
Authenticated. Returns the current user's full profile (including own contact info).

### Developers (the swipe feed)

#### `GET /api/developers`
Authenticated. Returns a **ranked, contact-stripped** feed.

Query params:
| Param | Type | Default | Effect |
|---|---|---|---|
| `role` | string | — | Case-insensitive substring match against `User.role` |
| `skills` | CSV or repeated | — | At least one matching skill — also used as ranking reference |
| `search` | string | — | Substring match against `User.name` |
| `availableOnly` | bool | `true` | Filter to `isAvailable = true` |
| `page` | int | `1` | 1-indexed |
| `limit` | int | `20` | Max 100 |

Auto-excludes:
- The current user
- Anyone the current user has already swiped on

```json
// 200
{
  "data": [
    {
      "id": 4,
      "name": "Joydeep",
      "role": "Frontend Developer",
      "bio": "...",
      "experienceYears": 2,
      "rating": 0,
      "isAvailable": true,
      "skills": ["React", "TypeScript", "Tailwind"],
      "score": 54,
      "skillMatch": 1,
      "matchingSkills": 3
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "limit": 20,
    "pages": 1,
    "referenceSkills": ["React", "TypeScript", "Tailwind"],
    "weights": { "skill": 50, "rating": 30, "experience": 20 }
  }
}
```

Note: contact fields (`email`, `phone`, `linkedin`, `github`, `telegram`) are **not present**.

### Swipes

#### `POST /api/swipes`
Authenticated. Records a swipe. Auto-creates a `Match` if reciprocal LIKE detected.

```json
// Request
{ "toUserId": 4, "direction": "LIKE" }   // or "PASS"
```

```json
// 201
{
  "swipe": { "id": 7, "fromUserId": 3, "toUserId": 4, "direction": "LIKE", "createdAt": "..." },
  "match": null,
  "isNewMatch": false
}
```

When the other side has already LIKEd:
```json
{
  "swipe": { ... },
  "match": { "id": 1, "userAId": 3, "userBId": 4, "createdAt": "..." },
  "isNewMatch": true
}
```

Errors: `400` self-swipe, `404` target not found.

### Matches / Connections

#### `GET /api/matches`
Authenticated. Returns the current user's matches with the **other** user's full contact info.

```json
// 200
{
  "data": [
    {
      "matchId": 1,
      "matchedAt": "...",
      "user": {
        "id": 4,
        "email": "joydeep@gmail.com",
        "name": "Joydeep",
        "role": "Frontend Developer",
        "phone": "+91 9876543213",
        "linkedin": "https://linkedin.com/in/joydeep-fe",
        "github": "https://github.com/joydeep-fe",
        "telegram": "@joydeep_fe",
        "skills": ["React", "TypeScript", "Tailwind"]
      }
    }
  ],
  "total": 1
}
```

#### `GET /api/matches/:userId`
Authenticated. Spec-compatibility alias — only succeeds if `:userId === currentUser.id`. Otherwise `403`.

### Health

#### `GET /health`
Public. Always returns `{ "status": "ok", ... }` — used by Render uptime check.

---

## Ranking algorithm

For every candidate in the feed:

```
referenceSkills  = explicit ?skills filter, OR the current user's own skills
matchingSkills   = count of candidate skills present in referenceSkills
skillMatch       = matchingSkills / max(referenceSkills.length, 1)        // 0..1
ratingNorm       = min(rating / 5, 1)                                     // 0..1   (rating is 0..5)
expNorm          = min(experienceYears / 10, 1)                           // 0..1   (caps at 10y)

score = (skillMatch  × 50)
      + (ratingNorm  × 30)
      + (expNorm     × 20)                                                // 0..100
```

Tiebreakers (in order): higher score → higher rating → more experience → lower id.

### Why normalize?

The literal spec formula `(skill_match × 50) + (rating × 30) + (experience × 20)` would let a 60-year-veteran score 1200 from experience alone, dwarfing skill match. Normalizing keeps all three factors in 0–1 range, so weights actually correspond to relative importance:

- **50% skill overlap** — most important
- **30% rating** — quality signal (still 0 for everyone in this prototype)
- **20% experience** — but caps at 10 years (anyone 10y+ is treated equally)

A perfect match maxes at exactly 100.

### Worked example

Sameet (Android dev) searches with `?skills=React,TypeScript`. Reference set = `["react", "typescript"]`.

| Candidate | Their skills | Matching | skillMatch | exp norm | Score |
|---|---|---|---|---|---|
| Alice (3y) | React, TS, Tailwind | 2 | 1.0 | 0.3 | **56** |
| Joydeep (2y) | React, TS, Tailwind | 2 | 1.0 | 0.2 | **54** |
| Harsh (4y) | Python, ML, etc. | 0 | 0.0 | 0.4 | **8** |
| Shikhar (3y) | Node, Postgres, etc. | 0 | 0.0 | 0.3 | **6** |

Alice wins on experience, even though she has the same skill match as Joydeep.

---

## Privacy model

| Endpoint | Email | Phone | LinkedIn | GitHub | Telegram |
|---|:-:|:-:|:-:|:-:|:-:|
| `GET /api/auth/me` (your own profile) | ✅ | ✅ | ✅ | ✅ | ✅ |
| `GET /api/developers` (the swipe feed) | hidden | hidden | hidden | hidden | hidden |
| `GET /api/matches` (your connections) | ✅ (other side) | ✅ | ✅ | ✅ | ✅ |

Stripping happens server-side in `src/services/developer.service.js → toPublicDeveloper()`. Even if a malicious client crafts a request, contact info never leaves the server until a `Match` row exists between the two users.

---

## Pages

### Public

| Route | Page | Notes |
|---|---|---|
| `/` | Landing | Hero + features + how-it-works + CTA. Auto-redirects authenticated users to `/dashboard`. |
| `/login` | Login | Email + password. |
| `/register` | Register | Full profile form including phone (required) + 3 optional contact links. |

### Authenticated (wrapped in `Protected` guard)

| Route | Page | Notes |
|---|---|---|
| `/dashboard` | Profile dashboard | Hero, your contact (visible only to your connections), stats, recent connections preview. |
| `/swipe` | Search-first swipe | Hero with role + skills picker → card stack. "Ask to collaborate" CTA. |
| `/connections` | Connections list | All matched developers with full contact reveal (clickable phone, mailto, LinkedIn, GitHub, Telegram). |
| `/matches` | redirects → `/connections` | Backwards-compat. |

---

## Deployment

This monorepo deploys backend and frontend to **separate platforms** by setting **Root Directory** in each.

### Backend on Render

1. https://render.com → **New Web Service** → connect this repo
2. Settings:
   | | |
   |---|---|
   | Root Directory | `backend` |
   | Build Command | `npm install && npx prisma generate && npx prisma migrate deploy` |
   | Start Command | `npm start` |
   | Runtime | Node |
3. Environment variables: `NODE_ENV=production`, `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `CLIENT_ORIGIN`. Render auto-injects `PORT` — don't set it manually.
4. Open `https://<service>.onrender.com/health` to verify.

> Note: free-tier services sleep after 15 min idle; first request after wake takes ~30s.

### Frontend on Vercel

1. https://vercel.com → **Import Git Repository**
2. Settings:
   | | |
   |---|---|
   | Framework Preset | Vite (auto-detected) |
   | Root Directory | `frontend` |
   | Install Command | `npm install --legacy-peer-deps` ← **required** |
3. Environment variable: `VITE_API_URL=https://<your-render-service>.onrender.com/api`
4. Once deployed, copy the Vercel URL and update `CLIENT_ORIGIN` in Render so CORS allows it.

### Database (Neon)

Already hosted — no extra deploy step. The `migrate deploy` in Render's build command applies any pending migrations on every deploy.

---

## Useful scripts

### Backend (`backend/`)

| Command | Description |
|---|---|
| `npm run dev` | nodemon + watch reload |
| `npm start` | production entrypoint |
| `npm run prisma:generate` | regenerate Prisma client |
| `npm run prisma:migrate` | run a dev migration (interactive) |
| `npm run prisma:studio` | open Prisma Studio web UI for DB inspection |
| `node scripts/inspect.js` | print all users + skill links in the terminal |
| `node scripts/e2e.js` | run end-to-end smoke test against the running API |

### Frontend (`frontend/`)

| Command | Description |
|---|---|
| `npm run dev` | Vite dev server, port 5173 |
| `npm run build` | production bundle to `dist/` |
| `npm run preview` | serve the prod bundle locally |

---

## Project status

Implemented (all checked):

- [x] Step 1 — Backend setup (Express, Prisma, env validation, error handling)
- [x] Step 2 — Database schema (User, Skill, UserSkill, Swipe, Match) with indexes
- [x] Step 3 — Auth APIs (register / login / me) with JWT + bcrypt
- [x] Step 4 — Developer fetch API with role / skills / search filtering + smart ranking
- [x] Step 5 — Swipe + auto-match logic (atomic, idempotent, race-safe)
- [x] Step 6 — Frontend setup (Vite + React 19 + Tailwind v3 + custom pink theme)
- [x] Step 7 — Search-first swipe UI with `react-tinder-card` + filter chips
- [x] Step 8 — End-to-end integration tested (login → search → swipe → connect → contact reveal)
- [x] Privacy model — contact info gated on mutual match
- [x] Marketing landing page at `/`
- [x] Phone number required, LinkedIn / GitHub / Telegram optional
- [x] Comprehensive `.gitignore` (root + per-package)

Possible follow-ups (not in current scope):

- Profile editing endpoint (`PATCH /api/auth/me`)
- Real-time chat after match (websockets)
- Image / avatar upload
- Rating system (currently every user is 0.0 — score is mostly skill-driven)
- Pagination cursor for the feed (currently page-based)
- Unit tests with Jest / Vitest

---

## Author

Built by **Sameet Patro & Harsh Kaldoke** as a 6th-semester FSD assignment.
Repo: https://github.com/Sameetpatro/devMatch

---

## License

MIT — feel free to fork, learn from, or extend.
