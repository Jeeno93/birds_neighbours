import { Router, Request, Response } from "express";
import { pool } from "../db";
import { requireAuth } from "../middleware/auth";

const router = Router();

function rowToRequest(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    birds: row.birds ?? [],
    sitType: row.sit_type,
    dateFrom: row.date_from,
    dateTo: row.date_to,
    district: row.district,
    comment: row.comment,
    contactTelegram: row.contact_telegram ?? "",
    status: row.status,
    createdAt: row.created_at,
  };
}

// GET /api/sit-requests?userId=&status=
router.get("/", async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string | undefined;
    const status = req.query.status as string | undefined;

    let query = "SELECT * FROM sit_requests WHERE 1=1";
    const params: unknown[] = [];
    if (userId) {
      params.push(userId);
      query += ` AND user_id = $${params.length}`;
    }
    if (status) {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }
    query += " ORDER BY created_at DESC";

    const result = await pool.query(query, params);
    res.json(result.rows.map(rowToRequest));
  } catch (err) {
    console.error("GET /api/sit-requests error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/sit-requests
router.post("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const { birds, sitType, dateFrom, dateTo, district, comment, contactTelegram, status } =
      req.body ?? {};

    if (!dateFrom || !dateTo) {
      res.status(400).json({ error: "dateFrom and dateTo are required" });
      return;
    }

    const result = await pool.query(
      `INSERT INTO sit_requests (
        user_id, birds, sit_type, date_from, date_to, district, comment, contact_telegram, status
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [
        req.userId,
        JSON.stringify(birds ?? []),
        sitType ?? "full",
        dateFrom,
        dateTo,
        district ?? "",
        comment ?? "",
        contactTelegram ?? "",
        status ?? "open",
      ]
    );
    res.status(201).json(rowToRequest(result.rows[0]));
  } catch (err) {
    console.error("POST /api/sit-requests error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/sit-requests/:id
router.put("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const owner = await pool.query("SELECT user_id FROM sit_requests WHERE id = $1", [
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

    const colMap: Record<string, { col: string; transform?: (v: unknown) => unknown }> = {
      birds: { col: "birds", transform: (v) => JSON.stringify(v ?? []) },
      sitType: { col: "sit_type" },
      dateFrom: { col: "date_from" },
      dateTo: { col: "date_to" },
      district: { col: "district" },
      comment: { col: "comment" },
      contactTelegram: { col: "contact_telegram" },
      status: { col: "status" },
    };

    const fields: string[] = [];
    const values: unknown[] = [];
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
    const result = await pool.query(sql, values);
    res.json(rowToRequest(result.rows[0]));
  } catch (err) {
    console.error("PUT /api/sit-requests/:id error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/sit-requests/:id/status
router.put("/:id/status", requireAuth, async (req: Request, res: Response) => {
  try {
    const { status } = req.body ?? {};
    if (!status) {
      res.status(400).json({ error: "status is required" });
      return;
    }
    const owner = await pool.query("SELECT user_id FROM sit_requests WHERE id = $1", [
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
    const result = await pool.query(
      "UPDATE sit_requests SET status = $1 WHERE id = $2 RETURNING *",
      [status, req.params.id]
    );
    res.json(rowToRequest(result.rows[0]));
  } catch (err) {
    console.error("PUT /api/sit-requests/:id/status error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
