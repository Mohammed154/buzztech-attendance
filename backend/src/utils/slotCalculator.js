/**
 * Calculates slot attendance (Slot-1, Slot-2, Slot-3) based on check-in and check-out timestamps.
 * 
 * Revised Slots:
 * - Slot-1: 09:35 AM to 11:30 AM (starts ~09:30)
 * - Lunch break: 11:30 AM to 12:15 PM (no attendance)
 * - Slot-2: 12:15 PM to 02:15 PM (14:15)
 * - Break: 02:15 PM to 02:30 PM (no attendance)
 * - Slot-3: 02:30 PM to 04:25 PM (16:25)
 */
export function calculateAttendanceSlots(checkInTime, checkOutTime = null, personType = "MANAGEMENT") {
  if (personType !== "MANAGEMENT" || !checkInTime) {
    return null;
  }

  const inDate = new Date(checkInTime);
  const outDate = checkOutTime ? new Date(checkOutTime) : new Date();

  // Helper to convert Date to minutes from midnight in IST (Asia/Kolkata)
  const getISTMinutes = (dateObj) => {
    const options = { timeZone: "Asia/Kolkata", hour12: false, hour: "2-digit", minute: "2-digit" };
    const timeStr = dateObj.toLocaleTimeString("en-US", options);
    const [hStr, mStr] = timeStr.split(":");
    let h = parseInt(hStr, 10);
    if (h === 24) h = 0; // Handle 24:00 edge case
    const m = parseInt(mStr, 10);
    return h * 60 + m;
  };

  const inMin = getISTMinutes(inDate);
  const outMin = getISTMinutes(outDate);

  const matchedSlots = [];

  // Slot 1: 09:35 (575 min) to 11:30 (690 min)
  // Qualified if check-in before Slot 1 end (11:30 / 690 min) and stay/check-out after Slot 1 start (09:30 / 570 min)
  if (inMin < 690 && outMin > 570) {
    matchedSlots.push("Slot-1");
  }

  // Slot 2: 12:15 (735 min) to 14:15 (855 min)
  // Qualified if check-in before Slot 2 end (14:15 / 855 min) and check-out reached at least Slot 2 start (12:15 / 735 min)
  if (inMin < 855 && outMin >= 735) {
    matchedSlots.push("Slot-2");
  }

  // Slot 3: 14:30 (870 min) to 16:25 (985 min)
  // Qualified if check-in before Slot 3 end (16:25 / 985 min) and check-out reached at least Slot 3 start (14:30 / 870 min)
  if (inMin < 985 && outMin >= 870) {
    matchedSlots.push("Slot-3");
  }

  return matchedSlots.length > 0 ? matchedSlots.join(", ") : null;
}
