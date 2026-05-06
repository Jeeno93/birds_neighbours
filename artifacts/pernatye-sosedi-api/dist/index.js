"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = require("./db");
const users_1 = __importDefault(require("./routes/users"));
const birds_1 = __importDefault(require("./routes/birds"));
const requests_1 = __importDefault(require("./routes/requests"));
const reviews_1 = __importDefault(require("./routes/reviews"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = Number(process.env.PORT) || 80;
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: "10mb" }));
app.use("/api/users", users_1.default);
app.use("/api/birds", birds_1.default);
app.use("/api/sit-requests", requests_1.default);
app.use("/api/reviews", reviews_1.default);
app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
});
async function start() {
    const client = await db_1.pool.connect();
    client.release();
    console.log("Database connected");
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}
start().catch((err) => {
    console.error("Failed to start server:", err);
    process.exit(1);
});
