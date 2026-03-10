<div align="center">

# 🏛️ LOKARYA
### *Work of the People*

**A Gamified Civic Engagement Platform for Urban Complaint Management,**
**Community Mobilization & AI-Powered Civic Intelligence**
[Features](#-features) · [Architecture](#-architecture) · [Modules](#-system-modules) · [API](#-api-reference) · [Setup](#-getting-started) · [Contributing](#-contributing)

---

</div>

## 📖 About

**Lokarya** (from Sanskrit *lokārya* — *work of the people*) is a full-stack civic technology platform built to bridge the gap between citizens and municipal service delivery. It combines structured complaint management, GPS-verified community missions, a configurable XP gamification economy, Google OAuth login, and an AI-powered civic assistant into a single, role-aware platform.

### The Problem It Solves

| Problem | Lokarya's Solution |
|---|---|
| Complaints filed but never tracked | 9-step pipeline with real-time timeline & SMS updates |
| Field workers unaccountable for resolution | WhatsApp magic-link with mandatory photo proof upload |
| Duplicate complaints clog the system | Haversine geospatial deduplication (50m radius) at submission |
| NGO mission attendance unverifiable | 3-layer QR + GPS + registration gate |
| No incentive for civic participation | Configurable XP engine with badges, leaderboard & rewards |
| Government schemes hard to discover | AI Civic Assistant powered by Gemini 2.5 Flash |

---

## ✨ Features

### 🗂️ Complaint Management
- File complaints with GPS location, category, image, and ward tagging
- **Intelligent duplicate detection** — Haversine distance check consolidates nearby same-category complaints into a single prioritized ticket
- **9-step lifecycle**: `pending → officer_assigned → worker_assigned → in_progress → resolved → closed/escalated`
- WhatsApp-based field worker task dispatch (no app login required)
- **Magic link tokenized proof upload** — time-limited, single-use, credential-free
- Citizen satisfaction rating (1–5★) with automatic escalation on low scores
- Full immutable timeline audit trail on every complaint
- **Auto-close cron job** — stale resolved complaints automatically closed on schedule

### 🎯 Community Missions (Activities)
- NGOs create missions with GPS anchor, capacity limits, registration deadlines, and XP rewards
- Admin approval gate with automatic QR code generation on approval
- **3-Layer QR Attendance Gate**:
  1. Cryptographic token validation & expiry check
  2. GPS proximity check (Haversine, default 300m radius)
  3. Prior registration confirmation
- Post-event attendance finalization with XP distribution per verified attendee
- Bonus XP configuration (early arrival, streak bonuses, etc.)

### ⚡ XP Gamification Engine
- **Database-driven rule system** — every action's XP, cooldown, and daily limit configurable at runtime
- Anti-abuse controls: per-action cooldown hours + daily maximum caps
- Full `XpLedger` — every earn/spend logged with balance, action type, and contextual metadata
- **Badge system** — `Badge` and `UserBadge` models track milestone achievements
- Reward redemption system — spend XP for civic rewards
- Public leaderboard (top 10 by XP)
- Admin audit tools for XP farming detection

### 🤖 Civic Assistant (AI Chatbot)
- Powered by **Google Gemini 2.5 Flash** (`gemini-2.5-flash`) via a dedicated Python FastAPI backend
- Answers questions about:
  - 🏠 Central & state government welfare schemes
  - 📋 Civic rights (RTI, Consumer Protection, housing regulations)
  - 🏛️ Lokarya platform guidance
  - 📍 Local municipal services and ward-specific information
- Server-side API proxying (API key never exposed to frontend)
- Conversation history maintained per session for contextual follow-ups
- Suggested question chips for first-time users

### 🔐 Authentication
- **Email/Password** registration and login with JWT dual-token flow
- **Google OAuth 2.0** — one-click sign-in via Passport.js strategy
- HttpOnly Secure SameSite cookies — XSS and CSRF resistant
- Silent token refresh (30-day session, no re-login needed)

### 🔔 Notifications
- **3-channel architecture**: In-app + SMS (Twilio) + WhatsApp (Twilio Business API)
- Real-time notification centre with unread count badge (`NotificationBell.jsx`)
- XP earn toasts shown instantly via `XpToastLayer.jsx`
- Per-notification and bulk mark-as-read

### 🛡️ Role-Based Access Control
| Role | Description |
|---|---|
| `citizen` | Self-register, file complaints, join missions, use Civic Assistant |
| `ngo_admin` | Create & manage missions, view QR codes, track attendance |
| `local_authority` | Assign officers/workers, resolve complaints (scoped to ward) |
| `super_admin` | Full platform control: users, XP rules, analytics, ledger audit |
| `field_worker` | Credential-free WhatsApp workflow — no platform account needed |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (React.js SPA)                  │
│  Citizen Portal │ NGO Dashboard │ Authority Panel │ Admin    │
│              Civic Assistant Chat UI  (ChatBot/)             │
└──────────────────────────┬──────────────────────────────────┘
                           │ REST API / HTTPS
          ┌────────────────┴────────────────┐
          │                                 │
┌─────────▼──────────────────┐   ┌──────────▼────────────────┐
│  BACKEND (Node.js/Express) │   │  AI BACKEND  (FastAPI)     │
│  src/app.js + server.js    │   │  Python + LangChain        │
│                            │   │  main.py                   │
│  Controllers (9)           │   │  Gemini 2.5 Flash API      │
│  Routes     (8)            │   └───────────────────────────-┘
│  Services   (4)            │
│  Middlewares(4)            │
│  Cron       (1)            │
└──────┬─────────────────────┘
       │
┌──────▼──────┐    ┌───────────────────────────────┐
│  MongoDB    │    │      External Services         │
│  Atlas      │    │  Twilio SMS & WhatsApp         │
│             │    │  Cloudinary (Media)            │
│  9 Models   │    │  Google OAuth 2.0              │
└─────────────┘    │  Google Gemini API             │
                   └───────────────────────────────┘
```

### Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React.js 18, TailwindCSS, Axios, Framer Motion, Recharts, Leaflet |
| **Backend** | Node.js 20, Express.js 4 |
| **AI Backend** | Python 3.11+, FastAPI, LangChain, Google GenAI (`langchain-google-genai`) |
| **Database** | MongoDB Atlas (Mongoose ODM) |
| **Auth** | JWT dual-token (15min access + 30d refresh), bcrypt, Passport.js (Google OAuth 2.0) |
| **Messaging** | Twilio SMS + WhatsApp Business API |
| **Media** | Cloudinary + Multer |
| **QR** | `qrcode` npm + Node.js `crypto` (signed tokens with GPS + expiry) |
| **AI** | Google Gemini 2.5 Flash (`gemini-2.5-flash`) |
| **Deployment** | Railway / Render / any Node + Python compatible VPS |

---

## 🔧 System Modules

### 1. Complaint Pipeline (9 Steps)

```
[1] Citizen Files        →  POST /api/complaints           (+10 XP)
[2] Duplicate Check      →  Haversine 50m radius           (+5 XP if duplicate)
[3] Officer Assigned     →  PATCH /:id/assign-officer
[4] Worker Assigned      →  PATCH /:id/assign-worker       (WhatsApp magic link sent)
[5] Worker Accepts       →  WhatsApp webhook reply "1"     (status: in_progress)
[6] Proof Uploaded       →  POST /magic-upload?token=...   (Cloudinary)
[7] Resolved             →  PATCH /:id/resolve             (+25 XP to citizen)
[8] Citizen Rates        →  POST /:id/rate (1-5★)          (+5 XP)
[9] Close / Escalate     →  ≥4★ = closed | <4★ = escalated
                             autoCloseCron.js runs on schedule for stale tickets
```

### 2. Mission Attendance Flow (6 Steps)

```
[1] NGO Creates          →  POST /api/activities
[2] Admin Approves + QR  →  PATCH /:id/approve             (QR auto-generated)
[3] Citizen Registers    →  POST /:id/register
[4] QR Scan (3-Layer)    →  POST /:id/scan
                              ├─ Layer 1: Token valid + not expired
                              ├─ Layer 2: GPS within gpsRadiusMeters
                              └─ Layer 3: User is registered
[5] NGO Ends Event       →  POST /:id/end                  (absentees marked)
[6] XP Distributed       →  xpEngineService.awardXp()     (base + bonus per attendee)
```

### 3. XP Engine Rules

| Action | Default XP | Cooldown | Daily Max |
|---|---|---|---|
| `file_complaint` | +10 | None | None |
| `first_complaint` | +30 | One-time | 1 |
| `verify_duplicate` | +5 | None | None |
| `complaint_resolved` | +25 | Per complaint | 1 |
| `rate_feedback` | +5 | Per complaint | 1 |
| `attend_ngo_activity` | Variable | Per activity | 1 |
| `ngo_create_mission` | +50 | Per activity | 1 |
| `redeem_reward` | −cost | None | None |

> All values are configurable live by `super_admin` via `PATCH /api/admin/xp-rules/:id`

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Python 3.11+
- MongoDB Atlas account (or local MongoDB)
- Twilio account (SMS + WhatsApp Business API)
- Cloudinary account
- Google Cloud project (Gemini API key + OAuth 2.0 credentials)

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/lokarya.git
cd lokarya
```

### 2. Backend Setup

```bash
cd backend-lokarya
npm install
```

Create `.env` in `backend-lokarya/` (see `.env.example`):

```env
# Server
NODE_ENV=development
PORT=5000

# Database
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/lokarya

# JWT
JWT_SECRET=your_super_secret_jwt_key_here
JWT_REFRESH_SECRET=your_super_secret_refresh_key_here

# Frontend URL (for magic links & OAuth redirects)
FRONTEND_URL=http://localhost:5173

# Google OAuth 2.0
GOOGLE_CLIENT_ID=xxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# Twilio
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1xxxxxxxxxx
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

```bash
npm run dev
# Server runs on http://localhost:5000
```

### 3. AI Backend Setup

```bash
cd ai-backend
python -m venv venv

# Windows
venv\Scripts\activate
# Mac / Linux
source venv/bin/activate

pip install -r requirements.txt
```

Create `.env` in `ai-backend/`:

```env
# Google Gemini API
GOOGLE_API_KEY=AIzaSy-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

```bash
uvicorn main:app --reload --port 8000
# AI backend runs on http://localhost:8000
```

### 4. Frontend Setup

```bash
cd frontend-lokarya
npm install
```

Create `.env` in `frontend-lokarya/`:

```env
VITE_API_URL=http://localhost:5000
VITE_AI_API_URL=http://localhost:8000
```

```bash
npm run dev
# App runs on http://localhost:5173
```

### 5. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a project → **APIs & Services** → **Credentials**
3. Click **Create Credentials** → **OAuth 2.0 Client ID**
4. Application type: **Web application**
5. Add Authorized redirect URI: `http://localhost:5000/api/auth/google/callback`
6. Copy **Client ID** and **Client Secret** into `backend-lokarya/.env`

### 6. Seed XP Rules (First Run)

```bash
curl -X POST http://localhost:5000/api/admin/xp-rules/reset \
  -H "Authorization: Bearer <super_admin_token>"
```

---

## 📡 API Reference

### Authentication
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new citizen | Public |
| `POST` | `/api/auth/login` | Login — sets httpOnly cookies | Public |
| `POST` | `/api/auth/logout` | Clear auth cookies | Auth |
| `GET` | `/api/auth/refresh` | Silent token refresh | Cookie |
| `GET` | `/api/auth/google` | Initiate Google OAuth flow | Public |
| `GET` | `/api/auth/google/callback` | Google OAuth callback | Public |
| `GET` | `/api/auth/me` | Get current user | Auth |
| `GET` | `/api/auth/profile` | Get full profile | Auth |
| `PUT` | `/api/auth/profile` | Update profile | Auth |

### Complaints
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/complaints` | File new complaint | Citizen |
| `GET` | `/api/complaints` | List complaints (with filters) | Auth |
| `GET` | `/api/complaints/my` | My complaints | Citizen |
| `GET` | `/api/complaints/:id` | Get complaint detail | Auth |
| `PATCH` | `/api/complaints/:id/assign-officer` | Assign ward officer | Authority |
| `PATCH` | `/api/complaints/:id/assign-worker` | Assign field worker + WhatsApp | Authority |
| `POST` | `/api/complaints/webhook` | Twilio WhatsApp webhook | Twilio |
| `POST` | `/api/complaints/magic-upload` | Field worker proof upload | Token |
| `PATCH` | `/api/complaints/:id/resolve` | Mark resolved | Authority |
| `POST` | `/api/complaints/:id/rate` | Rate resolution (1–5★) | Citizen |

### Activities / Missions
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/activities` | Create activity | NGO |
| `GET` | `/api/activities` | List open activities | Public |
| `GET` | `/api/activities/:id` | Get activity detail | Public |
| `PATCH` | `/api/activities/:id/approve` | Approve + generate QR | Admin |
| `POST` | `/api/activities/:id/register` | Register for mission | Auth |
| `POST` | `/api/activities/:id/scan` | QR attendance scan | Citizen |
| `POST` | `/api/activities/:id/end` | End event + distribute XP | NGO |
| `GET` | `/api/activities/:id/qr` | Get QR data URL | NGO/Admin |

### Gamification
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/gamification/leaderboard` | Top 10 users by XP | Public |
| `GET` | `/api/gamification/history` | My XP transaction history | Auth |
| `POST` | `/api/gamification/redeem` | Redeem XP for reward | Auth |

### Notifications
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/notifications` | Get my notifications | Auth |
| `PUT` | `/api/notifications/:id/read` | Mark one as read | Auth |
| `PUT` | `/api/notifications/read-all` | Mark all as read | Auth |

### Field Workers
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/field-workers` | List field workers (ward-scoped) | Authority |
| `POST` | `/api/field-workers` | Add field worker | Authority |
| `DELETE` | `/api/field-workers/:id` | Remove field worker | Authority |

### Admin (`super_admin` only)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/admin/stats` | Platform statistics |
| `GET` | `/api/admin/analytics?period=30` | Time-series analytics |
| `GET` | `/api/admin/users` | All users (paginated) |
| `PATCH` | `/api/admin/users/:id/role` | Change user role |
| `PATCH` | `/api/admin/users/:id/ban` | Ban / unban user |
| `POST` | `/api/admin/users/:id/award-xp` | Manually award XP |
| `POST` | `/api/admin/users/create` | Create NGO/Authority account |
| `PATCH` | `/api/admin/complaints/:id/force-status` | Force complaint status |
| `GET` | `/api/admin/xp-rules` | List all XP rules |
| `PATCH` | `/api/admin/xp-rules/:id` | Update XP rule values |
| `PATCH` | `/api/admin/xp-rules/:id/toggle` | Enable/disable rule |
| `POST` | `/api/admin/xp-rules/reset` | Reset to defaults |
| `GET` | `/api/admin/xp-ledger` | Full XP audit ledger |

### AI Backend (FastAPI — port 8000)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/chat` | Send message to Civic Assistant (Gemini) |
| `GET` | `/health` | AI backend health check |

---

## 📁 Project Structure

```
lokarya/
│
├── ai-backend/                            # Python FastAPI — Gemini Civic Assistant
│   ├── main.py                            # FastAPI app + Gemini 2.5 Flash + LangChain
│   ├── .env                               # GOOGLE_API_KEY
│   └── .gitignore
│
├── backend-lokarya/                       # Node.js + Express.js REST API
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js                      # MongoDB Atlas connection
│   │   │   └── passport.js                # Google OAuth 2.0 Passport strategy
│   │   │
│   │   ├── controllers/
│   │   │   ├── authController.js          # Register, login, Google OAuth, JWT refresh
│   │   │   ├── complaintController.js     # 9-step complaint pipeline
│   │   │   ├── activityController.js      # Mission lifecycle + QR attendance
│   │   │   ├── adminController.js         # Platform oversight + XP rule engine
│   │   │   ├── gamificationController.js  # Leaderboard, history, redeem
│   │   │   ├── notificationController.js  # In-app notifications
│   │   │   ├── fieldWorkerController.js   # Field worker CRUD
│   │   │   ├── privilegedAuthController.js# NGO/Authority provisioning
│   │   │   └── healthcheck.controller.js  # Health check endpoint
│   │   │
│   │   ├── cron/
│   │   │   └── autoCloseCron.js           # Auto-close stale resolved complaints
│   │   │
│   │   ├── middlewares/
│   │   │   ├── authMiddleware.js          # JWT verify + role guard
│   │   │   ├── errorMiddleware.js         # Global error handler
│   │   │   ├── uploadMiddleware.js        # Multer + Cloudinary config
│   │   │   └── validateMiddleware.js      # express-validator schemas
│   │   │
│   │   ├── models/
│   │   │   ├── User.js                    # Auth, XP balance, role, googleId
│   │   │   ├── Complaint.js               # magicToken, timeline[], SLA
│   │   │   ├── Activity.js                # qr{}, attendance[], bonusConfig
│   │   │   ├── FieldWorker.js             # Ward-scoped field staff
│   │   │   ├── Notification.js            # In-app notification records
│   │   │   ├── Badge.js                   # Badge definitions
│   │   │   ├── UserBadge.js               # User ↔ Badge earned records
│   │   │   ├── XpLedger.js                # Every XP earn/spend transaction
│   │   │   └── XpRule.js                  # Configurable XP rules
│   │   │
│   │   ├── routes/
│   │   │   ├── authRoutes.js              # Includes /google + /google/callback
│   │   │   ├── complaintRoutes.js
│   │   │   ├── activityRoutes.js
│   │   │   ├── adminRoutes.js
│   │   │   ├── gamificationRoutes.js
│   │   │   ├── notificationRoutes.js
│   │   │   ├── fieldWorkerRoutes.js
│   │   │   └── healthcheck.route.js
│   │   │
│   │   ├── services/
│   │   │   ├── xpEngineService.js         # awardXp(), bustRuleCache()
│   │   │   ├── badgeService.js            # Badge evaluation + award logic
│   │   │   ├── qrService.js               # generateQrData(), verifyQrPayload()
│   │   │   └── smsService.js              # Twilio SMS + WhatsApp templates
│   │   │
│   │   ├── utils/
│   │   │   ├── asyncHandler.js            # Async error wrapper
│   │   │   ├── notificationSystem.js      # sendNotification() multi-channel
│   │   │   └── locationUtils.js           # Haversine distance calculation
│   │   │
│   │   ├── app.js                         # Express app setup, middleware chain
│   │   └── server.js                      # HTTP server entry point
│   │
│   ├── public/                            # Static files
│   ├── uploads/                           # Temp local uploads (pre-Cloudinary)
│   ├── .env
│   ├── .env.example
│   └── package.json
│
└── frontend-lokarya/                      # React.js SPA (Vite)
    ├── src/
    │   ├── api/
    │   │   └── axios.js                   # Axios instance + auth interceptors
    │   │
    │   ├── assets/                        # Images and icons
    │   │
    │   ├── components/
    │   │   ├── BadgeCard/
    │   │   │   └── RewardsSection.jsx     # XP rewards + badge display
    │   │   ├── Cards/
    │   │   │   ├── AboutCard.jsx
    │   │   │   └── MissionCarousel.jsx
    │   │   ├── ChatBot/
    │   │   │   ├── ChatBubble.jsx         # Individual message bubble
    │   │   │   └── ChatWindow.jsx         # Civic Assistant chat UI
    │   │   ├── Footer/
    │   │   │   └── Footer.jsx
    │   │   ├── Hero/
    │   │   │   └── HeroSection.jsx
    │   │   ├── Navbar/
    │   │   │   └── Navbar.jsx
    │   │   ├── Profile/
    │   │   │   ├── EditProfileModal.jsx
    │   │   │   ├── ProfileCard.jsx
    │   │   │   ├── ProfilePanels.jsx
    │   │   │   ├── ProfileStyles.jsx
    │   │   │   └── profileTokens.js
    │   │   ├── routing/
    │   │   │   └── ProtectedRoute.jsx     # Role-based route guard
    │   │   └── Shared/
    │   │       ├── lokarya-ui.jsx         # Shared UI primitives / design system
    │   │       ├── NotificationBell.jsx   # Real-time notification icon + count
    │   │       └── XpToastLayer.jsx       # XP earn toast notifications
    │   │
    │   ├── context/
    │   │   └── AuthContext.jsx            # Global auth state + Google OAuth flow
    │   │
    │   ├── dashboards/
    │   │   ├── admin/
    │   │   │   ├── AdminDashboard.jsx
    │   │   │   ├── AdminOverview.jsx
    │   │   │   ├── ActivityApprovals.jsx
    │   │   │   ├── ComplaintOversight.jsx
    │   │   │   ├── NgoManagement.jsx
    │   │   │   ├── PlatformAnalytics.jsx
    │   │   │   ├── UserManagement.jsx
    │   │   │   ├── UserModals.jsx
    │   │   │   ├── XpLedgerAudit.jsx
    │   │   │   └── XpRuleEngine.jsx
    │   │   ├── authority/
    │   │   │   ├── AuthorityDashboard.jsx
    │   │   │   ├── AuthorityOverview.jsx
    │   │   │   ├── AuthorityAnalytics.jsx
    │   │   │   ├── ComplaintQueue.jsx
    │   │   │   ├── ComplaintDetail.jsx
    │   │   │   ├── FieldWorkerManager.jsx
    │   │   │   ├── EnhancedMiniMap.jsx    # Leaflet mini-map per complaint
    │   │   │   ├── MapView.jsx            # Full complaint map view
    │   │   │   └── PhotoCard.jsx          # Resolution proof photo viewer
    │   │   └── ngo/
    │   │       ├── NGODashboard.jsx
    │   │       ├── NGOOverview.jsx
    │   │       ├── NGOAnalytics.jsx
    │   │       ├── CreateMission.jsx
    │   │       ├── MissionManager.jsx
    │   │       └── AttendancePanel.jsx
    │   │
    │   ├── hooks/
    │   │   └── useLoginGate.jsx           # Redirect-to-login hook
    │   │
    │   ├── layouts/
    │   │   └── DashboardLayout.jsx        # Shared sidebar + header shell
    │   │
    │   ├── pages/
    │   │   ├── auth/
    │   │   │   ├── LoginModal.jsx         # Email login + Google OAuth button
    │   │   │   └── RegisterModal.jsx
    │   │   ├── LandingPage.jsx
    │   │   ├── ComplaintPage.jsx
    │   │   ├── ActivityPage.jsx
    │   │   ├── ProfilePage.jsx
    │   │   ├── QrScanPage.jsx             # Mobile QR scan interface
    │   │   ├── RewardsPage.jsx
    │   │   └── WorkerUploadPage.jsx       # Magic link proof upload UI
    │   │
    │   ├── utility/
    │   │   └── animation.js              # Framer Motion animation variants
    │   │
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    │
    ├── index.html
    ├── vite.config.js
    └── package.json
```

---

## 🔐 Security

- **JWT dual-token auth** — 15min access token + 30d refresh, both as `HttpOnly Secure SameSite` cookies
- **Google OAuth 2.0** — Passport.js strategy; no password stored for OAuth users
- **Password hashing** — bcrypt with work factor 12
- **Role middleware** — every protected route validates `req.user.role` server-side
- **Ward scoping** — `local_authority` queries automatically filtered to `req.user.ward`
- **Magic tokens** — single-use, time-limited (24h), nullified after first upload
- **API key security** — Gemini and Twilio keys server-side only, never in frontend bundles
- **XP anti-abuse** — cooldown hours + daily maximums enforced via XpLedger queries

---

## 🤖 Civic Assistant — How It Works

```
User Message
     │
     ▼
React Frontend  (ChatWindow.jsx — conversation history in component state)
     │
     ▼  POST /chat  { messages: [...history, newMessage] }
     │
     ▼
FastAPI AI Backend  (main.py — port 8000)
     │  Injects domain-scoping system prompt via LangChain
     │  Calls Google Gemini 2.5 Flash
     ▼
Gemini 2.5 Flash  (gemini-2.5-flash)
     │  Response scoped to: Gov schemes | Platform help | Civic rights
     ▼
JSON reply → Frontend → Rendered in ChatBubble.jsx
```

**Knowledge domains the assistant covers:**
- Central & state government welfare schemes and eligibility
- Civic rights — RTI filing, consumer protection, housing regulations
- Local municipal services and ward-level information
- How to use every feature of the Lokarya platform

---

## 🎮 XP System

Citizens earn XP for every positive civic action. XP can be redeemed for rewards, determines leaderboard rank, and unlocks **Badges** at milestone totals.

```
📋 File a complaint          +10 XP
🆕 First ever complaint      +30 XP  (one-time bonus)
🔁 Verify a duplicate        +5 XP
✅ Complaint gets resolved   +25 XP
⭐ Rate a resolution         +5 XP
🎯 Attend a mission (QR)     Variable (set per mission by NGO)
🏢 NGO mission approved      +50 XP
🎁 Redeem a reward           − XP cost
```

All values are configurable live by `super_admin` without redeployment.

---

## 📊 Admin Analytics

The `super_admin` dashboard provides:
- **Platform Stats** — total users by role, complaints (total/resolved/escalated), activities, XP distributed
- **Time-Series Charts** — user growth, complaint trend, XP distribution (configurable 7/30/90 days)
- **Breakdown Charts** — complaints by status, by category, by ward
- **Top Earners** — top 10 users by XP
- **XP Ledger Audit** — filterable by user, action type, date range with aggregate summaries
- **Activity Approvals** — pending NGO mission approval queue
- **NGO Management** — organization status and activity history

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m 'feat: add your feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a Pull Request

### Commit Convention
```
feat:     new feature
fix:      bug fix
docs:     documentation changes
refactor: code refactor
test:     adding tests
chore:    build/config changes
```

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgements

- **Google** — Gemini 2.5 Flash API powering the Civic Assistant + OAuth 2.0 authentication
- **Twilio** — SMS and WhatsApp Business API
- **Cloudinary** — Media storage and CDN

---

<div align="center">

**Built with ❤️ for citizens everywhere**

*Lokarya — Civic Technology for Urban Communities*

</div>