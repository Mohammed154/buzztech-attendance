import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api.js";
import TeamPill from "../components/TeamPill.jsx";

const MGMT_SUBTEAMS = [
  "CORE",
  "DOCUMENTATION",
  "WEBSITE",
  "PROMOTION",
  "SOCIAL_MEDIA_MARKETING",
];

export default function Reports() {
  const [filters, setFilters] = useState({
    type: "",
    sub_team: "",
    slot: "",
    from_date: "",
    to_date: "",
  });
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const params = Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v),
      );
      const data = await api.report(params);
      setRows(data.rows);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function update(field, value) {
    setFilters((f) => ({
      ...f,
      [field]: value,
      ...(field === "type" ? { sub_team: "" } : {}),
    }));
  }

  async function handleExport() {
    const params = Object.fromEntries(
      Object.entries(filters).filter(([, v]) => v),
    );
    try {
      await api.exportCsv(params);
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Link to="/" className="text-sm text-brand hover:underline mb-4 inline-block">
        ← Back to Dashboard
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold">Reports</h1>
          <p className="text-ink/50 text-sm mt-0.5">
            Filter and export attendance in tabular form.
          </p>
        </div>
        <button onClick={handleExport} className="btn-signal text-sm">
          Export CSV
        </button>
      </div>

      <div className="card p-4 mb-6 grid sm:grid-cols-2 md:grid-cols-5 gap-3">
        <div>
          <label className="label">Group</label>
          <select
            className="input"
            value={filters.type}
            onChange={(e) => update("type", e.target.value)}
          >
            <option value="">All</option>
            <option value="MANAGEMENT">Management</option>
            <option value="PARTICIPANT">Participants</option>
          </select>
        </div>
        {filters.type === "MANAGEMENT" && (
          <div>
            <label className="label">Sub-team</label>
            <select
              className="input"
              value={filters.sub_team}
              onChange={(e) => update("sub_team", e.target.value)}
            >
              <option value="">All</option>
              {MGMT_SUBTEAMS.map((t) => (
                <option key={t} value={t}>
                  {t.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className="label">Slot</label>
          <select
            className="input"
            value={filters.slot}
            onChange={(e) => update("slot", e.target.value)}
          >
            <option value="">All</option>
            <option value="Slot-1">Slot-1</option>
            <option value="Slot-2">Slot-2</option>
            <option value="Slot-3">Slot-3</option>
          </select>
        </div>
        <div>
          <label className="label">From date</label>
          <input
            type="date"
            className="input"
            value={filters.from_date}
            onChange={(e) => update("from_date", e.target.value)}
          />
        </div>
        <div>
          <label className="label">To date</label>
          <input
            type="date"
            className="input"
            value={filters.to_date}
            onChange={(e) => update("to_date", e.target.value)}
          />
        </div>
        <div className="sm:col-span-2 md:col-span-5">
          <button onClick={load} className="btn-primary text-sm">
            Apply filters
          </button>
        </div>
      </div>

      {error && <p className="text-danger text-sm mb-3">{error}</p>}

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-ink/5 text-ink/60 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-4 py-3">Name</th>
              <th className="text-left px-4 py-3">Class</th>
              <th className="text-left px-4 py-3">Enrollment No.</th>
              <th className="text-left px-4 py-3">Position</th>
              <th className="text-left px-4 py-3">Slot</th>
              <th className="text-left px-4 py-3">Group</th>
              <th className="text-left px-4 py-3">Date</th>
              <th className="text-left px-4 py-3 font-mono">Check-In</th>
              <th className="text-left px-4 py-3 font-mono">Check-Out</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {loading && (
              <tr>
                <td colSpan={9} className="px-4 py-6 text-center text-ink/40">
                  Loading…
                </td>
              </tr>
            )}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-6 text-center text-ink/40">
                  No records match these filters.
                </td>
              </tr>
            )}
            {rows.map((r, i) => (
              <tr key={i} className="hover:bg-black/[0.02]">
                <td className="px-4 py-3 font-medium">{r.full_name}</td>
                <td className="px-4 py-3 text-ink/60">{r.class_year || "—"}</td>
                <td className="px-4 py-3 font-mono text-ink/60">{r.enrollment_number || "—"}</td>
                <td className="px-4 py-3 text-ink/60">{r.position || "—"}</td>
                <td className="px-4 py-3 font-mono text-ink/60">{r.slot || "—"}</td>
                <td className="px-4 py-3">
                  <TeamPill team={r.sub_team} personType={r.person_type} />
                </td>
                <td className="px-4 py-3 font-mono text-ink/60">
                  {formatDate(r.date)}
                </td>
                <td className="px-4 py-3 font-mono text-ink/60">
                  {formatTime(r.check_in_time)}
                </td>
                <td className="px-4 py-3 font-mono text-ink/60">
                  {formatTime(r.check_out_time)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString();
}
function formatTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}
