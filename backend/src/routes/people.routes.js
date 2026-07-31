import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { buildCodePrefix, padSequence } from "../utils/generateCode.js";

const router = Router();
router.use(requireAuth);

// GET /api/people?type=MANAGEMENT&sub_team=CORE&search=roh
router.get("/", async (req, res) => {
  const { type, sub_team, search } = req.query;
  const conditions = ["is_active = TRUE"];
  const values = [];

  if (type) {
    values.push(type);
    conditions.push(`person_type = $${values.length}`);
  }
  if (sub_team) {
    values.push(sub_team);
    conditions.push(`sub_team = $${values.length}`);
  }
  if (search) {
    values.push(`%${search}%`);
    conditions.push(`(full_name ILIKE $${values.length} OR unique_code ILIKE $${values.length} OR enrollment_number ILIKE $${values.length})`);
  }

  const query = `
    SELECT person_id, full_name, class_year, enrollment_number, person_type, sub_team, position,
           contact_number, unique_code, created_at
    FROM people
    WHERE ${conditions.join(" AND ")}
    ORDER BY full_name ASC
    LIMIT 500
  `;
  const result = await pool.query(query, values);
  res.json({ people: result.rows });
});

// POST /api/people  — onboarding (first-time registration)
router.post("/", async (req, res) => {
  const { full_name, class_year, enrollment_number, person_type, sub_team, position, contact_number } = req.body;

  if (!full_name || !person_type || !sub_team) {
    return res.status(400).json({
      error: "full_name, person_type, and sub_team are required.",
    });
  }
  if (!["MANAGEMENT", "PARTICIPANT"].includes(person_type)) {
    return res.status(400).json({ error: "person_type must be MANAGEMENT or PARTICIPANT." });
  }

  // Duplicate check: check contact_number or enrollment_number
  if (contact_number || enrollment_number) {
    const dupConditions = [];
    const dupValues = [];

    if (contact_number) {
      dupValues.push(full_name, contact_number);
      dupConditions.push(`(full_name ILIKE $1 AND contact_number = $2)`);
    }
    if (enrollment_number) {
      dupValues.push(enrollment_number);
      dupConditions.push(`(enrollment_number = $${dupValues.length})`);
    }

    const dup = await pool.query(
      `SELECT person_id, full_name, enrollment_number, contact_number FROM people WHERE (${dupConditions.join(" OR ")}) AND is_active = TRUE`,
      dupValues
    );

    if (dup.rows.length > 0 && req.query.confirm !== "true") {
      const existing = dup.rows[0];
      let warningText = "A person with this name and contact number already exists.";
      if (existing.enrollment_number && enrollment_number && existing.enrollment_number === enrollment_number) {
        warningText = "A person with this enrollment number already exists.";
      }
      return res.status(409).json({
        warning: warningText,
        existing: dup.rows[0],
        hint: "Resubmit with ?confirm=true to add anyway.",
      });
    }
  }

  // Generate unique_code: PREFIX-SEQ
  const prefix = buildCodePrefix(person_type, sub_team);
  const countResult = await pool.query(
    "SELECT COUNT(*)::int AS count FROM people WHERE unique_code LIKE $1",
    [`${prefix}-%`]
  );
  const nextSeq = countResult.rows[0].count + 1;
  const unique_code = `${prefix}-${padSequence(nextSeq)}`;

  const insert = await pool.query(
    `INSERT INTO people
      (full_name, class_year, enrollment_number, person_type, sub_team, position, contact_number, unique_code, onboarded_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     RETURNING *`,
    [full_name, class_year || null, enrollment_number || null, person_type, sub_team, position || null,
     contact_number || null, unique_code, req.admin.admin_id]
  );

  res.status(201).json({ person: insert.rows[0] });
});

// PATCH /api/people/:id — edit or deactivate
router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const fields = ["full_name", "class_year", "enrollment_number", "position", "contact_number", "sub_team", "is_active"];
  const updates = [];
  const values = [];

  fields.forEach((field) => {
    if (req.body[field] !== undefined) {
      values.push(req.body[field]);
      updates.push(`${field} = $${values.length}`);
    }
  });

  if (updates.length === 0) {
    return res.status(400).json({ error: "No valid fields to update." });
  }

  values.push(id);
  const result = await pool.query(
    `UPDATE people SET ${updates.join(", ")} WHERE person_id = $${values.length} RETURNING *`,
    values
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: "Person not found." });
  }
  res.json({ person: result.rows[0] });
});

export default router;
