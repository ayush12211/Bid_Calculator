import React, { useState, useEffect, useCallback } from "react";
import { getAuction, placeBid, endAuction } from "../api";
import styles from "./AuctionRoom.module.css";

function formatINR(n) {
  return "₹" + Number(n).toLocaleString("en-IN");
}

function calcTimer(endsAt) {
  const diff = Math.max(0, new Date(endsAt) - Date.now());
  const m = Math.floor(diff / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return { text: `${m}:${s.toString().padStart(2, "0")}`, raw: diff };
}

export default function AuctionRoom({ auctionId, onReset }) {
  const [auction, setAuction] = useState(null);
  const [bidder, setBidder] = useState("");
  const [amount, setAmount] = useState("");
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(null);

  const fetchAuction = useCallback(async () => {
    try {
      const res = await getAuction(auctionId);
      setAuction(res.data);
    } catch (err) {
      console.error(err);
    }
  }, [auctionId]);

  useEffect(() => { fetchAuction(); }, [fetchAuction]);

  // Poll every 5s for real-time sync
  useEffect(() => {
    const interval = setInterval(fetchAuction, 5000);
    return () => clearInterval(interval);
  }, [fetchAuction]);

  // Countdown
  useEffect(() => {
    if (!auction) return;
    setTimer(calcTimer(auction.ends_at));
    const tick = setInterval(() => {
      if (auction.status === "ended") { clearInterval(tick); return; }
      setTimer(calcTimer(auction.ends_at));
    }, 1000);
    return () => clearInterval(tick);
  }, [auction?.ends_at, auction?.status]);

  const showToast = (msg, type = "info") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleBid = async () => {
    if (!bidder.trim()) return showToast("Enter your name.", "error");
    if (!amount || isNaN(amount) || Number(amount) <= 0)
      return showToast("Enter a valid bid amount.", "error");
    setLoading(true);
    try {
      await placeBid(auctionId, { bidder: bidder.trim(), amount: Number(amount) });
      showToast(`Bid of ${formatINR(amount)} placed!`, "success");
      setAmount("");
      await fetchAuction();
    } catch (err) {
      showToast(err.response?.data?.error || "Failed to place bid.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEnd = async () => {
    if (!window.confirm("End this auction now?")) return;
    try {
      await endAuction(auctionId);
      showToast("Auction ended.", "success");
      await fetchAuction();
    } catch (err) {
      showToast(err.response?.data?.error || "Failed to end.", "error");
    }
  };

  if (!auction) return <div className={styles.loading}>Loading auction...</div>;

  const isEnded = auction.status === "ended";
  const totalDuration =
    new Date(auction.ends_at) - new Date(auction.created_at);
  const timerPct = timer
    ? Math.min(100, (timer.raw / totalDuration) * 100)
    : 0;
  const timerColor =
    timerPct > 50 ? "#22a55b" : timerPct > 20 ? "#e08c00" : "#c0392b";

  return (
    <div className={styles.wrap}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onReset}>← New Auction</button>
        <span className={`${styles.badge} ${isEnded ? styles.badgeEnded : styles.badgeLive}`}>
          {isEnded ? "Ended" : "● Live"}
        </span>
      </div>

      {/* Item */}
      <div className={styles.itemCard}>
        <div className={styles.itemIcon}>🏷️</div>
        <div>
          <div className={styles.itemName}>{auction.item_name}</div>
          {auction.item_desc && (
            <div className={styles.itemDesc}>{auction.item_desc}</div>
          )}
        </div>
      </div>

      {/* Metrics */}
      <div className={styles.metrics}>
        <div className={styles.metric}>
          <div className={styles.metricLabel}>Highest bid</div>
          <div className={styles.metricValue} style={{ color: "#22a55b" }}>
            {formatINR(auction.highest_bid)}
          </div>
        </div>
        <div className={styles.metric}>
          <div className={styles.metricLabel}>Top bidder</div>
          <div className={styles.metricValue}>{auction.highest_bidder || "—"}</div>
        </div>
        <div className={styles.metric}>
          <div className={styles.metricLabel}>Total bids</div>
          <div className={styles.metricValue}>{auction.bids?.length ?? 0}</div>
        </div>
      </div>

      {/* Timer */}
      {!isEnded && timer && (
        <div className={styles.timerWrap}>
          <div className={styles.timerRow}>
            <span className={styles.timerLabel}>Time remaining</span>
            <span className={styles.timerText} style={{ color: timerColor }}>
              {timer.text}
            </span>
          </div>
          <div className={styles.timerBar}>
            <div
              className={styles.timerFill}
              style={{ width: `${timerPct}%`, background: timerColor }}
            />
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`${styles.toast} ${styles["toast_" + toast.type]}`}>
          {toast.msg}
        </div>
      )}

      {/* Bid form OR Winner */}
      {isEnded ? (
        <div className={styles.winnerCard}>
          <div className={styles.winnerTitle}>Auction Closed</div>
          {auction.highest_bidder ? (
            <>
              <div className={styles.winnerName}>🏆 {auction.highest_bidder} wins!</div>
              <div className={styles.winnerBid}>
                Winning bid: {formatINR(auction.highest_bid)}
              </div>
            </>
          ) : (
            <div className={styles.winnerName}>No bids were placed.</div>
          )}
        </div>
      ) : (
        <div className={styles.bidCard}>
          <h3 className={styles.bidTitle}>Place a bid</h3>
          <div className={styles.bidRow}>
            <input
              className={styles.input}
              placeholder="Your name"
              value={bidder}
              onChange={(e) => setBidder(e.target.value)}
            />
            <div className={styles.amountWrap}>
              <span className={styles.rupee}>₹</span>
              <input
                className={styles.input}
                style={{ paddingLeft: "28px" }}
                type="number"
                placeholder="Amount"
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleBid()}
              />
            </div>
            <button className={styles.bidBtn} onClick={handleBid} disabled={loading}>
              {loading ? "..." : "Bid"}
            </button>
          </div>
          <button className={styles.endBtn} onClick={handleEnd}>
            End Auction Now
          </button>
        </div>
      )}

      {/* Bid history */}
      <div className={styles.historyCard}>
        <h3 className={styles.historyTitle}>Bid history</h3>
        {!auction.bids || auction.bids.length === 0 ? (
          <p className={styles.empty}>No bids yet. Be the first!</p>
        ) : (
          <div className={styles.bidList}>
            {[...auction.bids].reverse().map((b, i) => (
              <div key={b.id} className={styles.bidEntry}>
                <div className={styles.bidEntryLeft}>
                  {i === 0 && <span className={styles.topBadge}>top</span>}
                  <span className={styles.bidderName}>{b.bidder}</span>
                </div>
                <span className={styles.bidAmount}>{formatINR(b.amount)}</span>
                <span className={styles.bidTime}>
                  {new Date(b.placed_at).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
