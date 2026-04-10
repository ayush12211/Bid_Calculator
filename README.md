# Online Auction System

This is a small full-stack auction project I built using React, Node.js, Express, and PostgreSQL.

The idea is simple: a user can create an auction, open the auction room, place bids in real time, and manually end the auction when needed. The app keeps track of the current highest bid, top bidder, bid history, and auction status.

## Tech stack

- Frontend: React + Vite
- Backend: Node.js + Express
- Database: PostgreSQL
- HTTP client: Axios

## What the project does

- Create a new auction with item name, description, starting price, and duration
- View auction details in a dedicated auction room
- Place bids with validation
- Show current highest bid, top bidder, and total bids
- Keep a bid history list
- Auto-end the auction when time is over
- Allow manual auction ending from the UI

## Project structure

```text
auction-system-pg/
├── backend/
│   ├── routes/
│   │   └── auction.js
│   ├── db.js
│   ├── schema.sql
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── api.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
└── README.md
```

## API routes

These are the main backend routes used in the project:

- `POST /api/auction` to create a new auction
- `GET /api/auction` to fetch all auctions
- `GET /api/auction/:id` to fetch a single auction with its bids
- `POST /api/auction/:id/bid` to place a bid
- `PATCH /api/auction/:id/end` to end an auction manually

## Running locally

### 1. Create the database

Make sure PostgreSQL is installed and running.

```bash
psql -U postgres
```

Inside `psql`, create the database:

```sql
CREATE DATABASE auctiondb;
```

Then run the schema:

```bash
psql -U postgres -d auctiondb -f backend/schema.sql
```

### 2. Start the backend

```bash
cd backend
npm install
```

Create a `.env` file inside `backend` and add:

```env
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/auctiondb
PORT=5000
```

Then run:

```bash
npm run dev
```

The backend should start on `http://localhost:5000`.

### 3. Start the frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend should start on `http://localhost:5173`.

## Deployment

I deployed the frontend and backend separately.

- Frontend: Vercel
- Backend: Render
- Database: Neon PostgreSQL

### Backend deployment

For the backend, set the root directory to `backend` and add the required environment variables on Render.

Important environment variables:

- `DATABASE_URL`
- `NODE_ENV=production`

Start command:

```bash
node server.js
```

### Frontend deployment

For the frontend, set the root directory to `frontend` on Vercel.

Add this environment variable:

```env
VITE_API_URL=https://your-backend-url.onrender.com
```

## A few notes

- The frontend uses `VITE_API_URL` in production and falls back to `/api` locally.
- Bids must always be greater than the current highest bid.
- The backend also checks whether the auction has already ended before accepting a bid.
