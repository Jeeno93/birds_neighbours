"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
function rowToReview(row) {
    if (!row)
        return null;
    return {
        id: row.id,
        fromUserId: row.from_user_id,
        toUserId: row.to_user_id,
        tags: row.tags ?? [],
        comment: row.comment,
        rating: row.rating,
        createdAt: row.created_at,
    };
}
// GET /api/reviews?toUserId=
router.get("/", async (req, res) => {
    try {
        const toUserId = req.query.toUserId;
        if (!toUserId) {
            res.status(400).json({ error: "toUserId query param is required" });
            return;
        }
        const result = await db_1.pool.query("SELECT * FROM reviews WHERE to_user_id = $1 ORDER BY created_at DESC", [toUserId]);
        res.json(result.rows.map(rowToReview));
    }
    catch (err) {
        console.error("GET /api/reviews error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
// POST /api/reviews
router.post("/", auth_1.requireAuth, async (req, res) => {
    const client = await db_1.pool.connect();
    try {
        const { toUserId, tags, comment, rating } = req.body ?? {};
        if (!toUserId) {
            res.status(400).json({ error: "toUserId is required" });
            return;
        }
        const ratingValue = Number(rating ?? 5);
        if (!Number.isFinite(ratingValue) || ratingValue < 1 || ratingValue > 5) {
            res.status(400).json({ error: "rating must be between 1 and 5" });
            return;
        }
        await client.query("BEGIN");
        const inserted = await client.query(`INSERT INTO reviews (from_user_id, to_user_id, tags, comment, rating)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`, [req.userId, toUserId, tags ?? [], comment ?? "", ratingValue]);
        await client.query(`UPDATE users SET
        rating = COALESCE((SELECT AVG(rating) FROM reviews WHERE to_user_id = $1), 0),
        reviews_count = (SELECT COUNT(*) FROM reviews WHERE to_user_id = $1)
       WHERE id = $1`, [toUserId]);
        await client.query("COMMIT");
        res.status(201).json(rowToReview(inserted.rows[0]));
    }
    catch (err) {
        await client.query("ROLLBACK").catch(() => { });
        console.error("POST /api/reviews error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
    finally {
        client.release();
    }
});
exports.default = router;
