import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { pool } from "./db";
import usersRouter from "./routes/users";
import birdsRouter from "./routes/birds";
import requestsRouter from "./routes/requests";
import reviewsRouter from "./routes/reviews";
import uploadRouter, { UPLOAD_DIR } from "./routes/upload";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 80;

// За прокси Amvera — чтобы req.protocol/host отражали внешний запрос.
app.set("trust proxy", true);

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Статика загруженных фото (публичное чтение — картинки предназначены к показу).
app.use("/uploads", express.static(UPLOAD_DIR));

app.use("/api/users", usersRouter);
app.use("/api/birds", birdsRouter);
app.use("/api/sit-requests", requestsRouter);
app.use("/api/reviews", reviewsRouter);
app.use("/api/upload", uploadRouter);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
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
