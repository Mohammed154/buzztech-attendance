# BuzzTech — Check-In / Check-Out Attendance Platform

A web app for tracking attendance of the BuzzTech Management Team (Core, Documentation,
Website, Promotion, Social Media Marketing — ~80 days) and the Participant Team
(~50-day hackathon), with admin-only login, first-time onboarding, check-in/check-out,
and tabular reporting with export.

This repo implements the **PRD, Design Document, and Tech Stack** already agreed on:

- **Frontend:** React (Vite) + Tailwind CSS
- **Backend:** Node.js + Express (REST API)
- **Database:** PostgreSQL (works with a plain Postgres instance or a Supabase project)
- **Auth:** JWT + bcrypt, admin-only

```
buzztech-attendance/
├── backend/     ← Express API + PostgreSQL schema
├── frontend/    ← React admin web app
└── DEPLOYMENT_GUIDE.md   ← step-by-step setup → deploy
```

## Quick Start (Local)

1. **Database:** create a Postgres database, then run `backend/sql/schema.sql` against it.
2. **Backend:**
   ```bash
   cd backend
   cp .env.example .env      # fill in DATABASE_URL, JWT_SECRET
   npm install
   npm run seed-admin        # creates your first admin login
   npm run dev                # starts API on http://localhost:5000
   ```
3. **Frontend:**
   ```bash
   cd frontend
   cp .env.example .env      # set VITE_API_URL=http://localhost:5000/api
   npm install
   npm run dev                # starts app on http://localhost:5173
   ```
4. Open `http://localhost:5173`, log in with the admin account you seeded, and start
   onboarding people / checking them in.

Full step-by-step instructions (including cloud deployment) are in **`DEPLOYMENT_GUIDE.md`**.

## How This Repo Maps to the Design Docs

| Design Doc Entity | Where it lives |
|---|---|
| `Admin` table | `backend/sql/schema.sql`, used in `routes/auth.routes.js` |
| `Person` table | `backend/sql/schema.sql`, used in `routes/people.routes.js` |
| `AttendanceRecord` table | `backend/sql/schema.sql`, used in `routes/attendance.routes.js` |
| Onboarding screen | `frontend/src/pages/Onboard.jsx` |
| Check-In/Check-Out screen | `frontend/src/pages/CheckInOut.jsx` |
| Reports screen (table + export) | `frontend/src/pages/Reports.jsx` |
| Dashboard | `frontend/src/pages/Dashboard.jsx` |

## Loading This Into Antigravity (or any agentic IDE)

1. Unzip/clone this folder as a workspace.
2. Point the agent at `DEPLOYMENT_GUIDE.md` first — it has the exact commands and
   environment variables needed to get the app running end-to-end.
3. The backend and frontend are independent Node projects (`backend/package.json`,
   `frontend/package.json`), so the agent can run/install/test them separately.
4. `backend/sql/schema.sql` is the single source of truth for the database structure —
   any schema changes should be made there first, then reflected in the route files.
