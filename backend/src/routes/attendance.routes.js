import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { calculateAttendanceSlots } from "../utils/slotCalculator.js";

const router = Router();
router.use(requireAuth);

function todayDate() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

async function getPersonType(person_id) {
  const res = await pool.query("SELECT person_type FROM people WHERE person_id = $1", [person_id]);
  return res.rows[0]?.person_type || null;
}

// GET /api/attendance/today?type=MANAGEMENT&sub_team=CORE&search=roh
// Returns people + their attendance status for today, for the check-in/out screen
router.get("/today", async (req, res) => {
  const { type, sub_team, search } = req.query;
  const date = todayDate();
  const conditions = ["p.is_active = TRUE"];
  const values = [date];

  if (type) {
    values.push(type);
    conditions.push(`p.person_type = $${values.length}`);
  }
  if (sub_team) {
    values.push(sub_team);
    conditions.push(`p.sub_team = $${values.length}`);
  }
  if (search) {
    values.push(`%${search}%`);
    conditions.push(`(p.full_name ILIKE $${values.length} OR p.unique_code ILIKE $${values.length} OR p.enrollment_number ILIKE $${values.length})`);
  }

  const query = `
    SELECT p.person_id, p.full_name, p.class_year, p.enrollment_number, p.person_type, p.sub_team,
           p.position, p.unique_code,
           a.record_id, a.check_in_time, a.check_out_time, a.status, a.slot
    FROM people p
    LEFT JOIN attendance_records a ON a.person_id = p.person_id AND a.date = $1
    WHERE ${conditions.join(" AND ")}
    ORDER BY p.full_name ASC
    LIMIT 500
  `;
  const result = await pool.query(query, values);

  const peopleWithSlots = result.rows.map((p) => {
    if (p.person_type === "MANAGEMENT" && p.check_in_time) {
      const computedSlot = calculateAttendanceSlots(p.check_in_time, p.check_out_time, p.person_type);
      return { ...p, slot: computedSlot || p.slot };
    }
    return p;
  });

  res.json({ date, people: peopleWithSlots });
});

// POST /api/attendance/check-in  { person_id }
router.post("/check-in", async (req, res) => {
  const { person_id, force } = req.body;
  if (!person_id) return res.status(400).json({ error: "person_id is required." });

  const date = todayDate();
  const existing = await pool.query(
    "SELECT * FROM attendance_records WHERE person_id = $1 AND date = $2",
    [person_id, date]
  );

  if (existing.rows.length > 0 && existing.rows[0].check_in_time && !force) {
    return res.status(409).json({
      error: "This person is already checked in today.",
      hint: "Resubmit with force:true to override.",
      record: existing.rows[0],
    });
  }

  const personType = await getPersonType(person_id);
  const now = new Date();
  const slotLabel = calculateAttendanceSlots(now, existing.rows[0]?.check_out_time, personType);

  let result;
  if (existing.rows.length > 0) {
    result = await pool.query(
      `UPDATE attendance_records
       SET check_in_time = now(), status = 'CHECKED_IN', marked_by_admin_id = $1, slot = $4
       WHERE person_id = $2 AND date = $3
       RETURNING *`,
      [req.admin.admin_id, person_id, date, slotLabel]
    );
  } else {
    result = await pool.query(
      `INSERT INTO attendance_records (person_id, date, check_in_time, status, marked_by_admin_id, slot)
       VALUES ($1, $2, now(), 'CHECKED_IN', $3, $4)
       RETURNING *`,
      [person_id, date, req.admin.admin_id, slotLabel]
    );
  }

  res.status(201).json({ record: result.rows[0] });
});

// POST /api/attendance/check-out  { person_id, force }
router.post("/check-out", async (req, res) => {
  const { person_id, force } = req.body;
  if (!person_id) return res.status(400).json({ error: "person_id is required." });

  const date = todayDate();
  const existing = await pool.query(
    "SELECT * FROM attendance_records WHERE person_id = $1 AND date = $2",
    [person_id, date]
  );

  if (existing.rows.length === 0 && !force) {
    return res.status(409).json({
      error: "No check-in recorded today for this person.",
      hint: "Resubmit with force:true to record a check-out anyway (flagged as manual correction).",
    });
  }

  const personType = await getPersonType(person_id);
  const now = new Date();

  let result;
  if (existing.rows.length === 0) {
    // Forced check-out without a prior check-in
    const slotLabel = calculateAttendanceSlots(now, now, personType);
    result = await pool.query(
      `INSERT INTO attendance_records
        (person_id, date, check_out_time, status, marked_by_admin_id, is_manual_correction, slot)
       VALUES ($1, $2, now(), 'CHECKED_OUT', $3, TRUE, $4)
       RETURNING *`,
      [person_id, date, req.admin.admin_id, slotLabel]
    );
  } else {
    const checkInTime = existing.rows[0].check_in_time || now;
    const slotLabel = calculateAttendanceSlots(checkInTime, now, personType);
    result = await pool.query(
      `UPDATE attendance_records
       SET check_out_time = now(), status = 'CHECKED_OUT', marked_by_admin_id = $1, slot = $4
       WHERE person_id = $2 AND date = $3
       RETURNING *`,
      [req.admin.admin_id, person_id, date, slotLabel]
    );
  }

  res.json({ record: result.rows[0] });
});

// PATCH /api/attendance/:record_id/correct  — manual time correction
router.patch("/:record_id/correct", async (req, res) => {
  const { record_id } = req.params;
  const { check_in_time, check_out_time, notes } = req.body;

  const existingRecordRes = await pool.query(
    `SELECT a.*, p.person_type 
     FROM attendance_records a 
     JOIN people p ON p.person_id = a.person_id 
     WHERE a.record_id = $1`,
    [record_id]
  );
  if (existingRecordRes.rows.length === 0) {
    return res.status(404).json({ error: "Attendance record not found." });
  }

  const existingRec = existingRecordRes.rows[0];
  const finalCheckIn = check_in_time || existingRec.check_in_time;
  const finalCheckOut = check_out_time || existingRec.check_out_time;
  const slotLabel = calculateAttendanceSlots(finalCheckIn, finalCheckOut, existingRec.person_type);

  const updates = ["is_manual_correction = TRUE", "status = 'EDITED'", "marked_by_admin_id = $1"];
  const values = [req.admin.admin_id];

  if (check_in_time) {
    values.push(check_in_time);
    updates.push(`check_in_time = $${values.length}`);
  }
  if (check_out_time) {
    values.push(check_out_time);
    updates.push(`check_out_time = $${values.length}`);
  }
  if (notes) {
    values.push(notes);
    updates.push(`notes = $${values.length}`);
  }

  values.push(slotLabel);
  updates.push(`slot = $${values.length}`);

  values.push(record_id);
  const result = await pool.query(
    `UPDATE attendance_records SET ${updates.join(", ")} WHERE record_id = $${values.length} RETURNING *`,
    values
  );

  res.json({ record: result.rows[0] });
});

export default router;

