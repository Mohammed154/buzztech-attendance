const TEAM_COLORS = {
  CORE: "bg-team-core/10 text-team-core",
  DOCUMENTATION: "bg-team-documentation/10 text-team-documentation",
  WEBSITE: "bg-team-website/10 text-team-website",
  PROMOTION: "bg-team-promotion/10 text-team-promotion",
  SOCIAL_MEDIA_MARKETING: "bg-team-social/10 text-team-social",
};

export default function TeamPill({ team, personType }) {
  const key = (team || "").toUpperCase().replace(/\s+/g, "_");
  const colorClass =
    personType === "PARTICIPANT"
      ? "bg-brand/10 text-brand"
      : TEAM_COLORS[key] || "bg-ink/10 text-ink";

  const display = personType === "PARTICIPANT" ? `Team ${team}` : team?.replace(/_/g, " ");

  return <span className={`team-pill ${colorClass}`}>{display}</span>;
}
