import React, { useState } from "react";
import { createAuction } from "../api";
import styles from "./CreateAuction.module.css";

export default function CreateAuction({ onCreated }) {
  const [form, setForm] = useState({
    itemName: "",
    itemDescription: "",
    startingPrice: "",
    durationMinutes: "3",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async () => {
    setError("");
    if (!form.itemName.trim()) return setError("Item name is required.");
    if (!form.durationMinutes || Number(form.durationMinutes) < 1)
      return setError("Duration must be at least 1 minute.");
    setLoading(true);
    try {
      const res = await createAuction({
        ...form,
        startingPrice: Number(form.startingPrice) || 0,
        durationMinutes: Number(form.durationMinutes),
      });
      onCreated(res.data.id);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create auction.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>Online Auction System</h1>
      <p className={styles.sub}>Create a new single-item auction to get started</p>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>New Auction</h2>

        <label className={styles.label}>Item name *</label>
        <input
          className={styles.input}
          name="itemName"
          placeholder='e.g. MacBook Pro 16" M3 Max'
          value={form.itemName}
          onChange={handle}
        />

        <label className={styles.label}>Description</label>
        <textarea
          className={styles.input}
          name="itemDescription"
          placeholder="Describe the item..."
          rows={3}
          value={form.itemDescription}
          onChange={handle}
          style={{ resize: "vertical" }}
        />

        <div className={styles.row}>
          <div style={{ flex: 1 }}>
            <label className={styles.label}>Starting price (₹)</label>
            <input
              className={styles.input}
              name="startingPrice"
              type="number"
              min="0"
              placeholder="0"
              value={form.startingPrice}
              onChange={handle}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label className={styles.label}>Duration (minutes)</label>
            <input
              className={styles.input}
              name="durationMinutes"
              type="number"
              min="1"
              placeholder="3"
              value={form.durationMinutes}
              onChange={handle}
            />
          </div>
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <button className={styles.btn} onClick={submit} disabled={loading}>
          {loading ? "Creating..." : "Create Auction →"}
        </button>
      </div>
    </div>
  );
}
