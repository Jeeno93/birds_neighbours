"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
function rowToUser(row) {
    if (!row)
        return null;
    return {
        id: row.id,
        telegramId: row.telegram_id,
        name: row.name,
        photoUrl: row.photo_url,
        city: row.city,
        district: row.district,
        lat: row.lat,
        lng: row.lng,
        experienceYears: row.experience_years,
        helpStatus: row.help_status,
        sitTypes: row.sit_types ?? [],
        capabilities: row.capabilities ?? [],
        otherPets: row.other_pets ?? [],
        rating: row.rating,
        reviewsCount: row.reviews_count,
        createdAt: row.created_at,
    };
}
// POST /api/users/auth — find-or-create by telegramId
router.post("/auth", async (req, res) => {
    try {
        const { telegramId, name } = req.body ?? {};
        if (!telegramId || !name) {
            res.status(400).json({ error: "telegramId and name are required" });
            return;
        }
        const found = await db_1.pool.query("SELECT * FROM users WHERE telegram_id = $1", [
            String(telegramId),
        ]);
        if (found.rowCount && found.rowCount > 0) {
            res.json(rowToUser(found.rows[0]));
            return;
        }
        const inserted = await db_1.pool.query(`INSERT INTO users (telegram_id, name) VALUES ($1, $2) RETURNING *`, [String(telegramId), String(name)]);
        res.status(201).json(rowToUser(inserted.rows[0]));
    }
    catch (err) {
        console.error("POST /api/users/auth error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
// GET /api/users — list neighbors that are help-active and have coords
router.get("/", async (req, res) => {
    try {
        const city = req.query.city ?? null;
        const params = [];
        let where = `help_status <> 'not_now' AND lat IS NOT NULL AND lng IS NOT NULL`;
        if (city) {
            params.push(city);
            where += ` AND city = $${params.length}`;
        }
        const result = await db_1.pool.query(`SELECT * FROM users WHERE ${where} ORDER BY rating DESC, reviews_count DESC`, params);
        res.json(result.rows.map(rowToUser));
    }
    catch (err) {
        console.error("GET /api/users error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
// GET /api/users/:id
router.get("/:id", async (req, res) => {
    try {
        const result = await db_1.pool.query("SELECT * FROM users WHERE id = $1", [req.params.id]);
        if (!result.rowCount) {
            res.status(404).json({ error: "User not found" });
            return;
        }
        res.json(rowToUser(result.rows[0]));
    }
    catch (err) {
        console.error("GET /api/users/:id error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
// PUT /api/users/:id — update profile (auth required + must match :id)
router.put("/:id", auth_1.requireAuth, async (req, res) => {
    try {
        if (req.userId !== req.params.id) {
            res.status(403).json({ error: "Forbidden" });
            return;
        }
        const { name, district, lat, lng, helpStatus, experienceYears, sitTypes, capabilities, otherPets, city, photoUrl, } = req.body ?? {};
        const fields = [];
        const values = [];
        const push = (col, val) => {
            values.push(val);
            fields.push(`${col} = $${values.length}`);
        };
        if (name !== undefined)
            push("name", name);
        if (district !== undefined)
            push("district", district);
        if (lat !== undefined)
            push("lat", lat);
        if (lng !== undefined)
            push("lng", lng);
        if (helpStatus !== undefined)
            push("help_status", helpStatus);
        if (experienceYears !== undefined)
            push("experience_years", experienceYears);
        if (sitTypes !== undefined)
            push("sit_types", sitTypes);
        if (capabilities !== undefined)
            push("capabilities", capabilities);
        if (otherPets !== undefined)
            push("other_pets", JSON.stringify(otherPets));
        if (city !== undefined)
            push("city", city);
        if (photoUrl !== undefined)
            push("photo_url", photoUrl);
        if (fields.length === 0) {
            res.status(400).json({ error: "No fields to update" });
            return;
        }
        values.push(req.params.id);
        const sql = `UPDATE users SET ${fields.join(", ")} WHERE id = $${values.length} RETURNING *`;
        const result = await db_1.pool.query(sql, values);
        if (!result.rowCount) {
            res.status(404).json({ error: "User not found" });
            return;
        }
        res.json(rowToUser(result.rows[0]));
    }
    catch (err) {
        console.error("PUT /api/users/:id error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
exports.default = router;
