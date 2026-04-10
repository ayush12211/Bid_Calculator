require("dotenv").config();
const express = require("express");
const cors = require("cors");
const pool = require("./db");
const auctionRoutes = require("./routes/auction");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use("/api/auction", auctionRoutes);

app.get("/", (req, res) => {
  res.json({ message: "Auction API is running ✓" });
});

// Test DB connection then start
pool.query("SELECT NOW()")
  .then(() => {
    console.log("Connected to PostgreSQL");
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("PostgreSQL connection error:", err.message);
    process.exit(1);
  });
