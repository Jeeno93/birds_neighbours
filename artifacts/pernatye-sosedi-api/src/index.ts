import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { pool } from "./db";
import usersRouter from "./routes/users";
import birdsRouter from "./routes/birds";
import requestsRouter from "./routes/requests";
import reviewsRouter from "./routes/reviews";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 80;

app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.use("/api/users", usersRouter);
app.use("/api/birds", birdsRouter);
app.use("/api/sit-requests", requestsRouter);
app.use("/api/reviews", reviewsRouter);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Временные миграционные эндпоинты — после применения на проде стоит убрать.
app.post("/migrate003", async (_req, res) => {
  try {
    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS address_comment TEXT;
    `);
    res.json({ success: true, message: "Migration 003 applied" });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e?.message ?? String(e) });
  }
});

app.post("/migrate004", async (_req, res) => {
  try {
    await pool.query(`
      ALTER TABLE birds ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT TRUE;
    `);
    res.json({ success: true, message: "Migration 004 applied" });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e?.message ?? String(e) });
  }
});

async function start(): Promise<void> {
  const client = await pool.connect();
  client.release();
  console.log("Database connected");
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
