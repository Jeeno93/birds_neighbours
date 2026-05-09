import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
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

app.post("/migrate", async (_req, res) => {
  try {
    const sql = fs.readFileSync(
      path.join(__dirname, "../migrations/001_init.sql"),
      "utf8"
    );
    await pool.query(sql);
    res.json({ success: true, message: "Migration applied" });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
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
