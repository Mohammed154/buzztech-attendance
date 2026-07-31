import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api.js";

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.summary().then(setSummary).catch((e) => setError(e.message));
  }, []);

  const mgmtTotal = summary?.totals.find((t) => t.person_type === "MANAGEMENT")?.total || 0;
  const partTotal = summary?.totals.find((t) => t.person_type === "PARTICIPANT")?.total || 0;
  const mgmtIn = summary?.checkedInToday.find((t) => t.person_type === "MANAGEMENT")?.checked_in || 0;
  const partIn = summary?.checkedInToday.find((t) => t.person_type === "PARTICIPANT")?.checked_in || 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold">Dashboard</h1>
          <p className="text-ink/50 text-sm mt-0.5">{summary?.date}</p>
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs font-mono text-success bg-success/10 px-2.5 py-1 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
          {summary?.currentlyCheckedIn ?? "—"} currently on-site
        </span>
      </div>

      {error && <p className="text-danger text-sm mb-4">{error}</p>}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <StatCard label="Management (total)" value={mgmtTotal} />
        <StatCard label="Management checked in today" value={mgmtIn} accent />
        <StatCard label="Participants (total)" value={partTotal} />
        <StatCard label="Participants checked in today" value={partIn} accent />
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <QuickLink to="/onboard" title="Onboard a person" desc="Register a new management member or participant." />
        <QuickLink to="/check-in-out" title="Check-in / Check-out" desc="Mark attendance for anyone, right now." />
        <QuickLink to="/reports" title="View reports" desc="See and export attendance in tabular form." />
      </div>
    </div>
  );
}

function StatCard({ label, value, accent }) {
  return (
    <div className="card p-4">
      <p className="text-ink/50 text-xs font-medium mb-1">{label}</p>
      <p className={`font-display text-3xl font-bold ${accent ? "text-brand" : "text-ink"}`}>{value}</p>
    </div>
  );
}

function QuickLink({ to, title, desc }) {
  return (
    <Link to={to} className="card p-5 hover:border-brand/30 hover:shadow-md transition-all group">
      <h3 className="font-medium text-ink group-hover:text-brand transition-colors">{title}</h3>
      <p className="text-ink/50 text-sm mt-1">{desc}</p>
    </Link>
  );
}
