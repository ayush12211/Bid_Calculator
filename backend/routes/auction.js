const express = require("express");
const router = express.Router();
const pool = require("../db");

// Helper: auto-end auction if time passed
async function autoEndIfExpired(client, auction) {
  if (auction.status === "active" && new Date() > new Date(auction.ends_at)) {
    await client.query(
      "UPDATE auctions SET status = 'ended' WHERE id = $1",
      [auction.id]
    );
    auction.status = "ended";
  }
  return auction;
}

// GET /api/auction — list all auctions
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM auctions ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auction — create auction
router.post("/", async (req, res) => {
  const { itemName, itemDescription, startingPrice, durationMinutes } = req.body;

  if (!itemName || !durationMinutes) {
    return res.status(400).json({ error: "itemName and durationMinutes are required" });
  }

  const endsAt = new Date(Date.now() + Number(durationMinutes) * 60 * 1000);
  const price = Number(startingPrice) || 0;

  try {
    const result = await pool.query(
      `INSERT INTO auctions (item_name, item_desc, starting_price, highest_bid, ends_at)
       VALUES ($1, $2, $3, $3, $4) RETURNING *`,
      [itemName, itemDescription || "", price, endsAt]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auction/:id — get auction + bids
router.get("/:id", async (req, res) => {
  const client = await pool.connect();
  try {
    const auctionRes = await client.query(
      "SELECT * FROM auctions WHERE id = $1",
      [req.params.id]
    );
    if (auctionRes.rows.length === 0)
      return res.status(404).json({ error: "Auction not found" });

    let auction = auctionRes.rows[0];
    auction = await autoEndIfExpired(client, auction);

    const bidsRes = await client.query(
      "SELECT * FROM bids WHERE auction_id = $1 ORDER BY placed_at ASC",
      [auction.id]
    );
    auction.bids = bidsRes.rows;

    res.json(auction);
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// POST /api/auction/:id/bid — place a bid
router.post("/:id/bid", async (req, res) => {
  const { bidder, amount } = req.body;

  if (!bidder || !amount) {
    return res.status(400).json({ error: "bidder and amount are required" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const auctionRes = await client.query(
      "SELECT * FROM auctions WHERE id = $1 FOR UPDATE",
      [req.params.id]
    );
    if (auctionRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Auction not found" });
    }

    let auction = auctionRes.rows[0];

    if (auction.status === "ended" || new Date() > new Date(auction.ends_at)) {
      await client.query("UPDATE auctions SET status='ended' WHERE id=$1", [auction.id]);
      await client.query("COMMIT");
      return res.status(400).json({ error: "Auction has already ended" });
    }

    const bidAmount = Number(amount);
    if (bidAmount <= Number(auction.highest_bid)) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        error: `Bid must be higher than current highest bid of ₹${auction.highest_bid}`,
      });
    }

    await client.query(
      "INSERT INTO bids (auction_id, bidder, amount) VALUES ($1, $2, $3)",
      [auction.id, bidder.trim(), bidAmount]
    );

    const updated = await client.query(
      `UPDATE auctions
       SET highest_bid = $1, highest_bidder = $2
       WHERE id = $3
       RETURNING *`,
      [bidAmount, bidder.trim(), auction.id]
    );

    await client.query("COMMIT");

    const countRes = await pool.query(
      "SELECT COUNT(*) FROM bids WHERE auction_id = $1",
      [auction.id]
    );

    res.json({
      message: "Bid placed successfully",
      highestBid: updated.rows[0].highest_bid,
      highestBidder: updated.rows[0].highest_bidder,
      totalBids: Number(countRes.rows[0].count),
    });
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// PATCH /api/auction/:id/end — manually end auction
router.patch("/:id/end", async (req, res) => {
  try {
    const result = await pool.query(
      "UPDATE auctions SET status = 'ended' WHERE id = $1 AND status = 'active' RETURNING *",
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(400).json({ error: "Auction not found or already ended" });
    }

    const auction = result.rows[0];
    const countRes = await pool.query(
      "SELECT COUNT(*) FROM bids WHERE auction_id = $1",
      [auction.id]
    );

    res.json({
      message: "Auction ended successfully",
      winner: auction.highest_bidder,
      winningBid: auction.highest_bid,
      totalBids: Number(countRes.rows[0].count),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
