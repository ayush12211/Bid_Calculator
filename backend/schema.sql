-- Run this once to create tables in your PostgreSQL database

CREATE TABLE IF NOT EXISTS auctions (
  id          SERIAL PRIMARY KEY,
  item_name   VARCHAR(255) NOT NULL,
  item_desc   TEXT DEFAULT '',
  starting_price NUMERIC(12, 2) DEFAULT 0,
  highest_bid    NUMERIC(12, 2) DEFAULT 0,
  highest_bidder VARCHAR(100) DEFAULT NULL,
  status      VARCHAR(10) DEFAULT 'active' CHECK (status IN ('active', 'ended')),
  ends_at     TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bids (
  id         SERIAL PRIMARY KEY,
  auction_id INTEGER NOT NULL REFERENCES auctions(id) ON DELETE CASCADE,
  bidder     VARCHAR(100) NOT NULL,
  amount     NUMERIC(12, 2) NOT NULL,
  placed_at  TIMESTAMPTZ DEFAULT NOW()
);
