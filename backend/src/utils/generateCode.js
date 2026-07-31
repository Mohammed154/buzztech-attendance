// Builds a readable unique code like MGT-CORE-0007 or PART-TEAMROCKET-0032
export function buildCodePrefix(personType, subTeam) {
  const typePart = personType === "MANAGEMENT" ? "MGT" : "PART";
  const teamPart = (subTeam || "GEN")
    .toString()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 12);
  return `${typePart}-${teamPart}`;
}

export function padSequence(n) {
  return String(n).padStart(4, "0");
}
