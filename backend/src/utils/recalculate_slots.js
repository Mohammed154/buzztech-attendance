import { pool } from "../db.js";
import { calculateAttendanceSlots } from "./slotCalculator.js";

async function recalculateSlots() {
  console.log("Starting attendance slot recalculation...");
  
  const query = `
    SELECT a.record_id, a.check_in_time, a.check_out_time, a.slot AS current_slot, p.person_type
    FROM attendance_records a
    JOIN people p ON p.person_id = a.person_id
    WHERE p.person_type = 'MANAGEMENT'
  `;

  try {
    const res = await pool.query(query);
    console.log(`Found ${res.rows.length} MANAGEMENT attendance records to evaluate.`);

    let updatedCount = 0;
    for (const record of res.rows) {
      const newSlot = calculateAttendanceSlots(record.check_in_time, record.check_out_time, record.person_type);
      if (newSlot !== record.current_slot) {
        await pool.query(
          "UPDATE attendance_records SET slot = $1 WHERE record_id = $2",
          [newSlot, record.record_id]
        );
        console.log(`Updated Record ${record.record_id}: "${record.current_slot}" -> "${newSlot}"`);
        updatedCount++;
      }
    }

    console.log(`\nSuccessfully updated ${updatedCount} records.`);
  } catch (err) {
    console.error("Error during slot recalculation:", err);
  } finally {
    await pool.end();
  }
}

recalculateSlots();
