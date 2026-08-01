# Deployment Guide

## BuzzTech — Check-In / Check-Out Attendance Platform

This guide walks through **local setup → database → backend → frontend → cloud deployment**,
with every required parameter listed. Follow it in order.

---

## 0. What You Need Before Starting

| Requirement               | Notes                                                                                                                 |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Node.js 18+ and npm       | Check with `node --version`                                                                                           |
| A PostgreSQL database     | Easiest: a free [Supabase](https://supabase.com) project. Also works with Neon, Railway, or a local Postgres install. |
| A GitHub account          | For deploying to Vercel/Render                                                                                        |
| (Optional) Vercel account | For hosting the frontend                                                                                              |
| (Optional) Render account | For hosting the backend                                                                                               |

---

## 1. Get the Code Into Antigravity / Your IDE

1. Unzip the `buzztech-attendance` folder (or `git clone` if you've pushed it to GitHub).
2. Open the folder as your workspace root in Antigravity.
3. You'll see two independent Node projects: `backend/` and `frontend/`. Treat them as
   separate terminals/processes throughout this guide.

---

## 2. Set Up the Database

### Option A — Supabase (recommended, free tier, zero server maintenance)

1. Go to [supabase.com](https://supabase.com) → **New Project**.
2. Choose a name (e.g. `buzztech-attendance`), a strong database password (save it), and a region close to you.
3. Once the project is ready, go to **Project Settings → Database → Connection string → URI**.
   Copy it — it looks like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```
   This is your `DATABASE_URL`.
4. Go to the **SQL Editor** in Supabase, paste the entire contents of
   `backend/sql/schema.sql`, and run it. This creates the `admins`, `people`, and
   `attendance_records` tables plus the reporting view.

### Option B — Local PostgreSQL

1. Install Postgres locally and create a database:
   ```bash
   createdb buzztech
   ```
2. Run the schema against it:
   ```bash
   psql -d buzztech -f backend/sql/schema.sql
   ```
3. Your `DATABASE_URL` will be something like:
   ```
   postgresql://postgres:yourpassword@localhost:5432/buzztech
   ```

---

## 3. Configure & Run the Backend

```bash
cd backend
cp .env.example .env
npm install
```

Open `.env` and fill in these parameters:

| Variable              | Required                                 | Example / Notes                                                                                                           |
| --------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `PORT`                | No                                       | Defaults to `5000`                                                                                                        |
| `NODE_ENV`            | No                                       | `development` locally, `production` when deployed                                                                         |
| `DATABASE_URL`        | **Yes**                                  | From Step 2                                                                                                               |
| `DB_SSL`              | **Yes** if using Supabase/Render/Railway | `true` for hosted Postgres, `false` for plain local Postgres                                                              |
| `JWT_SECRET`          | **Yes**                                  | Any long random string. Generate one: `openssl rand -hex 32`                                                              |
| `JWT_EXPIRES_IN`      | No                                       | Defaults to `12h`                                                                                                         |
| `FRONTEND_ORIGIN`     | **Yes**                                  | The URL your frontend runs on, e.g. `http://localhost:5173`. Comma-separate if you need more than one (local + deployed). |
| `SEED_ADMIN_NAME`     | Only for seeding                         | Your name, e.g. `Joint Coordinator`                                                                                       |
| `SEED_ADMIN_EMAIL`    | Only for seeding                         | The email you'll log in with                                                                                              |
| `SEED_ADMIN_PASSWORD` | Only for seeding                         | A real password — change the placeholder                                                                                  |

Create your first admin login:

```bash
npm run seed-admin
```

You should see `✅ Admin created: <your email>`. This is the account you'll use to log
into the app. You can seed more admins later by rerunning with different `SEED_ADMIN_*`
values, or by inserting rows directly into the `admins` table (password must be a
bcrypt hash — the seed script handles hashing for you).

Start the API:

```bash
npm run dev
```

You should see: `✅ BuzzTech API running on http://localhost:5000`

Sanity check it's alive:

```bash
curl http://localhost:5000/api/health
```

---

## 4. Configure & Run the Frontend

Open a **second terminal**:

```bash
cd frontend
cp .env.example .env
npm install
```

Open `.env` and set:

| Variable       | Required | Example                                                                               |
| -------------- | -------- | ------------------------------------------------------------------------------------- |
| `VITE_API_URL` | **Yes**  | `http://localhost:5000/api` locally; your deployed backend URL + `/api` in production |

Start the app:

```bash
npm run dev
```

Open `http://localhost:5173`, log in with the admin credentials you seeded, and:

1. Go to **Onboard** → add a few management members and a few participants.
2. Go to **Check-In / Out** → check someone in, then check them out.
3. Go to **Reports** → confirm the row appears with Name, Class, Position, Date, Check-In, Check-Out, and try **Export CSV**.

If all three work, your local setup is fully functional.

---

## 5. Deploying the Backend (Render — free tier works)

1. Push this repo to GitHub (if you haven't already).
2. Go to [render.com](https://render.com) → **New → Web Service** → connect your GitHub repo.
3. Set:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free is fine to start
4. Under **Environment**, add every variable from your `backend/.env` (same names/values
   as Step 3, but `FRONTEND_ORIGIN` should be your **deployed** frontend URL once you have
   it from Step 6 — you can update this after Step 6 and redeploy).
5. Deploy. Note the resulting URL, e.g. `https://buzztech-api.onrender.com`.
6. Confirm it's live: `https://buzztech-api.onrender.com/api/health`

> Railway works the same way if you prefer it over Render — same root directory,
> build/start commands, and environment variables.

---

## 6. Deploying the Frontend (Vercel — free tier works)

1. Go to [vercel.com](https://vercel.com) → **New Project** → import the same GitHub repo.
2. Set:
   - **Root Directory:** `frontend`
   - **Framework Preset:** Vite (auto-detected)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. Under **Environment Variables**, add:
   - `VITE_API_URL` = your Render backend URL + `/api`, e.g.
     `https://buzztech-api.onrender.com/api`
4. Deploy. Vercel gives you a URL like `https://buzztech-attendance.vercel.app`.
5. **Go back to Render** (Step 5) and update `FRONTEND_ORIGIN` to this Vercel URL, then
   redeploy the backend so CORS allows requests from it.

---

## 7. Post-Deployment Checklist

- [ ] Visit the deployed frontend URL and confirm the login page loads.
- [ ] Log in with your seeded admin account.
- [ ] Onboard a test person, check them in/out, confirm it shows in Reports.
- [ ] Delete the test person's attendance if needed (directly in the database, or via a
      future "delete" feature) before real onboarding begins.
- [ ] Share the login credentials only with authorized admins (per the PRD, this is
      currently the only access model — no participant/member self-login).
- [ ] Bookmark the Supabase/Render dashboards for monitoring and backups.

---

## 8. Ongoing Operations

- **Backups:** Supabase provides automatic daily backups on paid tiers; on the free tier,
  periodically export data via **Reports → Export CSV** as a manual backup, especially
  before major event days.
- **Adding more admins:** rerun `npm run seed-admin` locally with new `SEED_ADMIN_*`
  values pointed at the **production** `DATABASE_URL`, or insert directly into the
  `admins` table.
- **Monitoring uptime:** Render's free tier can spin down after inactivity — the first
  request after idle time may take a few seconds. If this matters for live event days,
  consider upgrading to Render's paid tier for the event window.

---

## 9. Full Parameter Reference (Quick Copy)

**Backend `.env`:**

```
PORT=5000
NODE_ENV=production
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
DB_SSL=true
JWT_SECRET=<generate with: openssl rand -hex 32>
JWT_EXPIRES_IN=12h
FRONTEND_ORIGIN=https://your-frontend.vercel.app
SEED_ADMIN_NAME=Joint Coordinator
SEED_ADMIN_EMAIL=admin@buzztech.local
SEED_ADMIN_PASSWORD=<a real password>
```

**Frontend `.env`:**

```
VITE_API_URL=https://your-backend.onrender.com/api
```

//testing bla bla
