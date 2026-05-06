"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
function rowToRequest(row) {
    if (!row)
        return null;
    return {
        id: row.id,
        userId: row.user_id,
        birds: row.birds ?? [],
        sitType: row.sit_type,
        dateFrom: row.date_from,
        dateTo: row.date_to,
        district: row.district,
        comment: row.comment,
        status: row.status,
        createdAt: row.created_at,
    };
}
// GET /api/sit-requests?userId=
router.get("/", async (req, res) => {
    try {
        const userId = req.query.userId;
        if (!userId) {
            res.status(400).json({ error: "userId query param is required" });
            return;
        }
        const result = await db_1.pool.query("SELECT * FROM sit_requests WHERE user_id = $1 ORDER BY created_at DESC", [userId]);
        res.json(result.rows.map(rowToRequest));
    }
    catch (err) {
        console.error("GET /api/sit-requests error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
// POST /api/sit-requests
router.post("/", auth_1.requireAuth, async (req, res) => {
    try {
        const { birds, sitType, dateFrom, dateTo, district, comment, status } = req.body ?? {};
        if (!dateFrom || !dateTo) {
            res.status(400).json({ error: "dateFrom and dateTo are required" });
            return;
        }
        const result = await db_1.pool.query(`INSERT INTO sit_requests (
        user_id, birds, sit_type, date_from, date_to, district, comment, status
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`, [
            req.userId,
            JSON.stringify(birds ?? []),
            sitType ?? "full",
            dateFrom,
            dateTo,
            district ?? "",
            comment ?? "",
            status ?? "open",
        ]);
        res.status(201).json(rowToRequest(result.rows[0]));
    }
    catch (err) {
        console.error("POST /api/sit-requests error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
// PUT /api/sit-requests/:id
router.put("/:id", auth_1.requireAuth, async (req, res) => {
    try {
        const owner = await db_1.pool.query("SELECT user_id FROM sit_requests WHERE id = $1", [
            req.params.id,
        ]);
        if (!owner.rowCount) {
            res.status(404).json({ error: "Request not found" });
            return;
        }
        if (owner.rows[0].user_id !== req.userId) {
            res.status(403).json({ error: "Forbidden" });
            return;
        }
        const colMap = {
            birds: { col: "birds", transform: (v) => JSON.stringify(v ?? []) },
            sitType: { col: "sit_type" },
            dateFrom: { col: "date_from" },
            dateTo: { col: "date_to" },
            district: { col: "district" },
            comment: { col: "comment" },
            status: { col: "status" },
        };
        const fields = [];
        const values = [];
        for (const [key, { col, transform }] of Object.entries(colMap)) {
            if (req.body && req.body[key] !== undefined) {
                values.push(transform ? transform(req.body[key]) : req.body[key]);
                fields.push(`${col} = $${values.length}`);
            }
        }
        if (fields.length === 0) {
            res.status(400).json({ error: "No fields to update" });
            return;
        }
        values.push(req.params.id);
        const sql = `UPDATE sit_requests SET ${fields.join(", ")} WHERE id = $${values.length} RETURNING *`;
        const result = await db_1.pool.query(sql, values);
        res.json(rowToRequest(result.rows[0]));
    }
    catch (err) {
        console.error("PUT /api/sit-requests/:id error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
// PUT /api/sit-requests/:id/status
router.put("/:id/status", auth_1.requireAuth, async (req, res) => {
    try {
        const { status } = req.body ?? {};
        if (!status) {
            res.status(400).json({ error: "status is required" });
            return;
        }
        const owner = await db_1.pool.query("SELECT user_id FROM sit_requests WHERE id = $1", [
            req.params.id,
        ]);
        if (!owner.rowCount) {
            res.status(404).json({ error: "Request not found" });
            return;
        }
        if (owner.rows[0].user_id !== req.userId) {
            res.status(403).json({ error: "Forbidden" });
            return;
        }
        const result = await db_1.pool.query("UPDATE sit_requests SET status = $1 WHERE id = $2 RETURNING *", [status, req.params.id]);
        res.json(rowToRequest(result.rows[0]));
    }
    catch (err) {
        console.error("PUT /api/sit-requests/:id/status error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
exports.default = router;
