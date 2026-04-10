# Online Auction System
**Stack:** Node.js + Express + PostgreSQL (backend) · React + Vite (frontend)

---

## Folder Structure

```
auction-system/
├── backend/
│   ├── routes/
│   │   └── auction.js      ← All API routes
│   ├── db.js               ← PostgreSQL pool
│   ├── schema.sql          ← Run once to create tables
│   ├── server.js           ← Express entry point
│   ├── .env.example        ← Copy to .env
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── CreateAuction.jsx
    │   │   ├── CreateAuction.module.css
    │   │   ├── AuctionRoom.jsx
    │   │   └── AuctionRoom.module.css
    │   ├── App.jsx
    │   ├── api.js
    │   ├── main.jsx
    │   └── index.css
    ├── index.html
    ├── vite.config.js
    └── package.json
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auction` | Create a new auction |
| GET | `/api/auction` | List all auctions |
| GET | `/api/auction/:id` | Get auction + bids |
| POST | `/api/auction/:id/bid` | Place a bid |
| PATCH | `/api/auction/:id/end` | Manually end auction |

---

# ─── LOCAL SETUP ───────────────────────────────────────

## Prerequisites
- Node.js 18+ installed
- PostgreSQL installed locally OR use a free cloud DB (see deploy section)

---

## Step 1 — Set up the database (local)

If you have PostgreSQL installed locally:

```bash
# Open psql
psql -U postgres

# Create the database
CREATE DATABASE auctiondb;
\q

# Run the schema
psql -U postgres -d auctiondb -f backend/schema.sql
```

---

## Step 2 — Backend (local)

```bash
cd backend
cp .env.example .env
```

Edit `.env`:
```
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/auctiondb
PORT=5000
```

```bash
npm install
npm run dev
```

Backend runs at → http://localhost:5000

Test it: open http://localhost:5000 — you should see `{ "message": "Auction API is running ✓" }`

---

## Step 3 — Frontend (local)

Open a new terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at → http://localhost:5173

The Vite proxy forwards all `/api` calls to `localhost:5000` automatically — no CORS issues.

---

# ─── DEPLOYMENT ────────────────────────────────────────
# Deploy backend FIRST, then frontend.
# ──────────────────────────────────────────────────────

## DEPLOY STEP 1 — Push code to GitHub

```bash
# In the root auction-system folder
git init
git add .
git commit -m "initial commit"
# Create a repo on github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/auction-system.git
git push -u origin main
```

---

## DEPLOY STEP 2 — Create PostgreSQL DB on Neon (free, no credit card)

1. Go to → https://neon.tech and sign up (free)
2. Click **New Project** → give it a name → Create
3. On the dashboard, click **SQL Editor**
4. Paste the contents of `backend/schema.sql` and click **Run**
   (This creates the `auctions` and `bids` tables)
5. Go to **Dashboard** → **Connection Details**
6. Copy the **Connection string** — it looks like:
   ```
   postgresql://username:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
   Save this — you'll need it in the next step.

---

## DEPLOY STEP 3 — Deploy Backend on Render (free)

1. Go to → https://render.com and sign up
2. Click **New +** → **Web Service**
3. Connect your GitHub repo
4. Fill in:
   - **Name:** `auction-backend`
   - **Root Directory:** `backend`
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
5. Scroll to **Environment Variables** → Add:
   - Key: `DATABASE_URL`
   - Value: *(paste your Neon connection string)*
   - Key: `NODE_ENV`
   - Value: `production`
6. Click **Create Web Service**
7. Wait ~2 minutes for the build to finish
8. Copy your backend URL — it looks like:
   ```
   https://auction-backend-xxxx.onrender.com
   ```
9. Test it: open `https://auction-backend-xxxx.onrender.com` in browser
   → You should see `{ "message": "Auction API is running ✓" }`

---

## DEPLOY STEP 4 — Deploy Frontend on Vercel (free)

1. Go to → https://vercel.com and sign up
2. Click **Add New** → **Project**
3. Import your GitHub repo
4. Fill in:
   - **Root Directory:** `frontend`
   - **Framework Preset:** Vite (auto-detected)
5. Expand **Environment Variables** → Add:
   - Key: `VITE_API_URL`
   - Value: `https://auction-backend-xxxx.onrender.com`
     *(your actual Render URL from Step 3 — no trailing slash)*
6. Click **Deploy**
7. Wait ~1 minute
8. Vercel gives you a URL like:
   ```
   https://auction-system-yogesh.vercel.app
   ```

That's the link you send to the recruiter. ✓

---

## What to send the recruiter

```
Live demo: https://auction-system-yogesh.vercel.app
GitHub:    https://github.com/YOUR_USERNAME/auction-system

Stack: Node.js · Express · PostgreSQL (Neon) · React · Vite
Deployed: Render (backend) + Vercel (frontend)
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Backend crashes on Render | Check Render logs — usually wrong DATABASE_URL |
| Frontend shows blank page | Check VITE_API_URL in Vercel env vars — must be full URL with https |
| CORS error in browser | Make sure VITE_API_URL has no trailing slash |
| Neon SSL error locally | Set `ssl: false` in db.js (already handled by NODE_ENV check) |
| Render sleeps after 15 min | Free tier spins down — first request takes ~30s to wake up |
