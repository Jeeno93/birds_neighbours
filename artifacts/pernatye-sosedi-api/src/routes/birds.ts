import { Router, Request, Response } from "express";
import { pool } from "../db";
import { requireAuth } from "../middleware/auth";

const router = Router();

function rowToBird(row: any) {
  if (!row) return null;
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
    isPublic: row.is_public ?? true,
    createdAt: row.created_at,
  };
}

// GET /api/birds?userId=
// Если запрашивающий пользователь (x-user-id) НЕ владелец списка — отдаём
// только публичные карточки (is_public = true либо NULL для старых записей).
router.get("/", async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string | undefined;
    if (!userId) {
      res.status(400).json({ error: "userId query param is required" });
      return;
    }
    const requesterId = (req.header("x-user-id") || "").trim() || null;
    const isOwner = requesterId !== null && requesterId === userId;
    const sql = isOwner
      ? "SELECT * FROM birds WHERE user_id = $1 ORDER BY created_at ASC"
      : "SELECT * FROM birds WHERE user_id = $1 AND (is_public IS TRUE OR is_public IS NULL) ORDER BY created_at ASC";
    const result = await pool.query(sql, [userId]);
    res.json(result.rows.map(rowToBird));
  } catch (err) {
    console.error("GET /api/birds error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/birds
router.post("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const {
      species,
      name,
      photoUrl,
      ageMonths,
      food,
      schedule,
      diseases,
      medications,
      catchNotes,
      vetNotes,
      sitLocation,
      wasExamined,
      vetName,
      vetContact,
      lastCheckupDate,
      medicationExperience,
      isPublic,
    } = req.body ?? {};

    if (!species || !name) {
      res.status(400).json({ error: "species and name are required" });
      return;
    }

    const result = await pool.query(
      `INSERT INTO birds (
        user_id, species, name, photo_url, age_months, food, schedule, diseases,
        medications, catch_notes, vet_notes, sit_location, was_examined,
        vet_name, vet_contact, last_checkup_date, medication_experience, is_public
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18
      ) RETURNING *`,
      [
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
        isPublic ?? true,
      ]
    );
    res.status(201).json(rowToBird(result.rows[0]));
  } catch (err) {
    console.error("POST /api/birds error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/birds/:id
router.put("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const owner = await pool.query("SELECT user_id FROM birds WHERE id = $1", [req.params.id]);
    if (!owner.rowCount) {
      res.status(404).json({ error: "Bird not found" });
      return;
    }
    if (owner.rows[0].user_id !== req.userId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const colMap: Record<string, string> = {
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
      isPublic: "is_public",
    };

    const fields: string[] = [];
    const values: unknown[] = [];
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
    const result = await pool.query(sql, values);
    res.json(rowToBird(result.rows[0]));
  } catch (err) {
    console.error("PUT /api/birds/:id error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/birds/:id
router.delete("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const owner = await pool.query("SELECT user_id FROM birds WHERE id = $1", [req.params.id]);
    if (!owner.rowCount) {
      res.status(404).json({ error: "Bird not found" });
      return;
    }
    if (owner.rows[0].user_id !== req.userId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    await pool.query("DELETE FROM birds WHERE id = $1", [req.params.id]);
    res.status(204).end();
  } catch (err) {
    console.error("DELETE /api/birds/:id error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
