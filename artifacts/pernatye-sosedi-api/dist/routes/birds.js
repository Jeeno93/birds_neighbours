"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
function rowToBird(row) {
    if (!row)
        return null;
    return {
        id: row.id,
        userId: row.user_id,
        species: row.species,
        name: row.name,
        photoUrl: row.photo_url,
        ageMonths: row.age_months,
        food: row.food,
        schedule: row.schedule,
        diseases: row.diseases ?? [],
        medications: row.medications,
        catchNotes: row.catch_notes,
        vetNotes: row.vet_notes,
        sitLocation: row.sit_location,
        wasExamined: row.was_examined,
        vetName: row.vet_name,
        vetContact: row.vet_contact,
        lastCheckupDate: row.last_checkup_date,
        medicationExperience: row.medication_experience,
        createdAt: row.created_at,
    };
}
// GET /api/birds?userId=
router.get("/", async (req, res) => {
    try {
        const userId = req.query.userId;
        if (!userId) {
            res.status(400).json({ error: "userId query param is required" });
            return;
        }
        const result = await db_1.pool.query("SELECT * FROM birds WHERE user_id = $1 ORDER BY created_at ASC", [userId]);
        res.json(result.rows.map(rowToBird));
    }
    catch (err) {
        console.error("GET /api/birds error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
// POST /api/birds
router.post("/", auth_1.requireAuth, async (req, res) => {
    try {
        const { species, name, photoUrl, ageMonths, food, schedule, diseases, medications, catchNotes, vetNotes, sitLocation, wasExamined, vetName, vetContact, lastCheckupDate, medicationExperience, } = req.body ?? {};
        if (!species || !name) {
            res.status(400).json({ error: "species and name are required" });
            return;
        }
        const result = await db_1.pool.query(`INSERT INTO birds (
        user_id, species, name, photo_url, age_months, food, schedule, diseases,
        medications, catch_notes, vet_notes, sit_location, was_examined,
        vet_name, vet_contact, last_checkup_date, medication_experience
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17
      ) RETURNING *`, [
            req.userId,
            species,
            name,
            photoUrl ?? null,
            ageMonths ?? null,
            food ?? "",
            schedule ?? "",
            diseases ?? [],
            medications ?? "",
            catchNotes ?? "",
            vetNotes ?? "",
            sitLocation ?? "flexible",
            wasExamined ?? false,
            vetName ?? null,
            vetContact ?? null,
            lastCheckupDate ?? null,
            medicationExperience ?? null,
        ]);
        res.status(201).json(rowToBird(result.rows[0]));
    }
    catch (err) {
        console.error("POST /api/birds error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
// PUT /api/birds/:id
router.put("/:id", auth_1.requireAuth, async (req, res) => {
    try {
        const owner = await db_1.pool.query("SELECT user_id FROM birds WHERE id = $1", [req.params.id]);
        if (!owner.rowCount) {
            res.status(404).json({ error: "Bird not found" });
            return;
        }
        if (owner.rows[0].user_id !== req.userId) {
            res.status(403).json({ error: "Forbidden" });
            return;
        }
        const colMap = {
            species: "species",
            name: "name",
            photoUrl: "photo_url",
            ageMonths: "age_months",
            food: "food",
            schedule: "schedule",
            diseases: "diseases",
            medications: "medications",
            catchNotes: "catch_notes",
            vetNotes: "vet_notes",
            sitLocation: "sit_location",
            wasExamined: "was_examined",
            vetName: "vet_name",
            vetContact: "vet_contact",
            lastCheckupDate: "last_checkup_date",
            medicationExperience: "medication_experience",
        };
        const fields = [];
        const values = [];
        for (const [key, col] of Object.entries(colMap)) {
            if (req.body && req.body[key] !== undefined) {
                values.push(req.body[key]);
                fields.push(`${col} = $${values.length}`);
            }
        }
        if (fields.length === 0) {
            res.status(400).json({ error: "No fields to update" });
            return;
        }
        values.push(req.params.id);
        const sql = `UPDATE birds SET ${fields.join(", ")} WHERE id = $${values.length} RETURNING *`;
        const result = await db_1.pool.query(sql, values);
        res.json(rowToBird(result.rows[0]));
    }
    catch (err) {
        console.error("PUT /api/birds/:id error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
// DELETE /api/birds/:id
router.delete("/:id", auth_1.requireAuth, async (req, res) => {
    try {
        const owner = await db_1.pool.query("SELECT user_id FROM birds WHERE id = $1", [req.params.id]);
        if (!owner.rowCount) {
            res.status(404).json({ error: "Bird not found" });
            return;
        }
        if (owner.rows[0].user_id !== req.userId) {
            res.status(403).json({ error: "Forbidden" });
            return;
        }
        await db_1.pool.query("DELETE FROM birds WHERE id = $1", [req.params.id]);
        res.status(204).end();
    }
    catch (err) {
        console.error("DELETE /api/birds/:id error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
exports.default = router;
