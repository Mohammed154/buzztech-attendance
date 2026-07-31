import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();
router.use(requireAuth);

function buildFilters(query) {
  const { type, sub_team, person_id, from_date, to_date, slot } = query;
  const conditions = [];
  const values = [];

  if (type) {
    values.push(type);
    conditions.push(`person_type = $${values.length}`);
  }
  if (sub_team) {
    values.push(sub_team);
    conditions.push(`sub_team = $${values.length}`);
  }
  if (person_id) {
    values.push(person_id);
    conditions.push(`person_id = $${values.length}`);
  }
  if (from_date) {
    values.push(from_date);
    conditions.push(`date >= $${values.length}`);
  }
  if (to_date) {
    values.push(to_date);
    conditions.push(`date <= $${values.length}`);
  }
  if (slot) {
    values.push(slot);
    conditions.push(`slot = $${values.length}`);
  }

  return { where: conditions.length ? `WHERE ${conditions.join(" AND ")}` : "", values };
}

// GET /api/reports?type=&sub_team=&person_id=&from_date=&to_date=&slot=
// Returns the tabular attendance report: Name, Class, Position, Slot, Date, Check-In, Check-Out
router.get("/", async (req, res) => {
  const filterConditions = [];
  const filterValues = [];
  const { type, sub_team, person_id, from_date, to_date, slot } = req.query;

  if (type) { filterValues.push(type); filterConditions.push(`p.person_type = $${filterValues.length}`); }
  if (sub_team) { filterValues.push(sub_team); filterConditions.push(`p.sub_team = $${filterValues.length}`); }
  if (person_id) { filterValues.push(person_id); filterConditions.push(`p.person_id = $${filterValues.length}`); }
  if (from_date) { filterValues.push(from_date); filterConditions.push(`a.date >= $${filterValues.length}`); }
  if (to_date) { filterValues.push(to_date); filterConditions.push(`a.date <= $${filterValues.length}`); }
  if (slot) { filterValues.push(slot); filterConditions.push(`a.slot = $${filterValues.length}`); }

  const whereClause = filterConditions.length ? `WHERE ${filterConditions.join(" AND ")}` : "";

  const query = `
    SELECT p.full_name, p.class_year, p.enrollment_number, p.position, p.person_type, p.sub_team,
           p.unique_code, a.date, a.check_in_time, a.check_out_time, a.status,
           a.is_manual_correction, a.slot
    FROM attendance_records a
    JOIN people p ON p.person_id = a.person_id
    ${whereClause}
    ORDER BY a.date DESC, p.full_name ASC
    LIMIT 5000
  `;
  const result = await pool.query(query, filterValues);
  res.json({ rows: result.rows });
});

// GET /api/reports/export.csv — same filters, returns CSV file
router.get("/export.csv", async (req, res) => {
  const filterConditions = [];
  const filterValues = [];
  const { type, sub_team, person_id, from_date, to_date, slot } = req.query;

  if (type) { filterValues.push(type); filterConditions.push(`p.person_type = $${filterValues.length}`); }
  if (sub_team) { filterValues.push(sub_team); filterConditions.push(`p.sub_team = $${filterValues.length}`); }
  if (person_id) { filterValues.push(person_id); filterConditions.push(`p.person_id = $${filterValues.length}`); }
  if (from_date) { filterValues.push(from_date); filterConditions.push(`a.date >= $${filterValues.length}`); }
  if (to_date) { filterValues.push(to_date); filterConditions.push(`a.date <= $${filterValues.length}`); }
  if (slot) { filterValues.push(slot); filterConditions.push(`a.slot = $${filterValues.length}`); }

  const whereClause = filterConditions.length ? `WHERE ${filterConditions.join(" AND ")}` : "";

  const query = `
    SELECT p.full_name, p.class_year, p.enrollment_number, p.position, p.person_type, p.sub_team,
           p.unique_code, a.date, a.check_in_time, a.check_out_time, a.status, a.slot
    FROM attendance_records a
    JOIN people p ON p.person_id = a.person_id
    ${whereClause}
    ORDER BY a.date DESC, p.full_name ASC
    LIMIT 5000
  `;
  const result = await pool.query(query, filterValues);

  const header = "Name,Class,Enrollment No.,Position,Slot,Group,Sub-Team,Code,Date,Check-In,Check-Out,Status\n";
  const rows = result.rows.map((r) => [
    r.full_name, r.class_year || "", r.enrollment_number || "", r.position || "", r.slot || "", r.person_type, r.sub_team,
    r.unique_code, r.date instanceof Date ? r.date.toISOString().slice(0, 10) : r.date,
    r.check_in_time ? new Date(r.check_in_time).toLocaleString() : "",
    r.check_out_time ? new Date(r.check_out_time).toLocaleString() : "",
    r.status,
  ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","));

  const csv = header + rows.join("\n");
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="buzztech_attendance_${Date.now()}.csv"`);
  res.send(csv);
});

// GET /api/reports/summary — dashboard stats for today
router.get("/summary", async (req, res) => {
  const date = new Date().toISOString().slice(0, 10);

  const totals = await pool.query(
    `SELECT person_type, COUNT(*)::int AS total FROM people WHERE is_active = TRUE GROUP BY person_type`
  );
  const checkedInToday = await pool.query(
    `SELECT p.person_type, COUNT(*)::int AS checked_in
     FROM attendance_records a
     JOIN people p ON p.person_id = a.person_id
     WHERE a.date = $1 AND a.check_in_time IS NOT NULL
     GROUP BY p.person_type`,
    [date]
  );
  const currentlyCheckedIn = await pool.query(
    `SELECT COUNT(*)::int AS count
     FROM attendance_records
     WHERE date = $1 AND check_in_time IS NOT NULL AND check_out_time IS NULL`,
    [date]
  );

  res.json({
    date,
    totals: totals.rows,
    checkedInToday: checkedInToday.rows,
    currentlyCheckedIn: currentlyCheckedIn.rows[0].count,
  });
});

export default router;
