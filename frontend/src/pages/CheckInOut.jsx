import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api.js";
import TeamPill from "../components/TeamPill.jsx";

export default function CheckInOut() {
  const [type, setType] = useState("");
  const [search, setSearch] = useState("");
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (type) params.type = type;
      if (search) params.search = search;
      const data = await api.todayAttendance(params);
      setPeople(data.people);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setLoading(false);
    }
  }, [type, search]);

  useEffect(() => {
    const t = setTimeout(load, 250); // debounce search
    return () => clearTimeout(t);
  }, [load]);

  async function handleCheckIn(person, force = false) {
    setActionError("");
    try {
      await api.checkIn(person.person_id, force);
      load();
    } catch (err) {
      if (err.status === 409 && !force) {
        if (confirm(`${err.message} Override and check in again?`)) {
          handleCheckIn(person, true);
        }
      } else {
        setActionError(err.message);
      }
    }
  }

  async function handleCheckOut(person, force = false) {
    setActionError("");
    try {
      await api.checkOut(person.person_id, force);
      load();
    } catch (err) {
      if (err.status === 409 && !force) {
        if (confirm(`${err.message} Force a check-out anyway?`)) {
          handleCheckOut(person, true);
        }
      } else {
        setActionError(err.message);
      }
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link to="/" className="text-sm text-brand hover:underline mb-4 inline-block">
        ← Back to Dashboard
      </Link>
      <h1 className="font-display text-2xl font-semibold mb-1">Check-In / Check-Out</h1>
      <p className="text-ink/50 text-sm mb-6">Today — mark attendance for management or participants.</p>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          className="input sm:flex-1"
          placeholder="Search by name or code…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="flex gap-2">
          {["", "MANAGEMENT", "PARTICIPANT"].map((t) => (
            <button
              key={t || "all"}
              onClick={() => setType(t)}
              className={`px-3 py-2 rounded-lg text-sm font-medium border whitespace-nowrap ${
                type === t ? "bg-brand text-white border-brand" : "border-black/10 text-ink/60 hover:bg-black/5"
              }`}
            >
              {t === "" ? "All" : t === "MANAGEMENT" ? "Management" : "Participants"}
            </button>
          ))}
        </div>
      </div>

      {actionError && <p className="text-danger text-sm mb-3">{actionError}</p>}

      <div className="card divide-y divide-black/5">
        {loading && <p className="p-4 text-sm text-ink/40">Loading…</p>}
        {!loading && people.length === 0 && (
          <p className="p-4 text-sm text-ink/40">No one matches this search. Try a different name or onboard them first.</p>
        )}
        {people.map((p) => {
          const status = !p.check_in_time
            ? "not_checked_in"
            : p.check_in_time && !p.check_out_time
            ? "checked_in"
            : "checked_out";

          return (
            <div key={p.person_id} className="flex items-center justify-between gap-4 p-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium truncate">{p.full_name}</span>
                  <TeamPill team={p.sub_team} personType={p.person_type} />
                </div>
                <p className="text-xs text-ink/40 font-mono mt-0.5">
                  {p.unique_code} · {p.class_year || "—"}{p.enrollment_number ? ` · Enr: ${p.enrollment_number}` : ""} {p.position ? `· ${p.position}` : ""}
                </p>
                {status !== "not_checked_in" && (
                  <p className="text-xs text-ink/40 mt-1 font-mono flex items-center gap-1.5 flex-wrap">
                    {p.slot && (
                      <span className="bg-brand/10 text-brand px-1.5 py-0.5 rounded font-semibold text-[11px]">
                        {p.slot}
                      </span>
                    )}
                    <span>
                      In {formatTime(p.check_in_time)}
                      {p.check_out_time ? ` · Out ${formatTime(p.check_out_time)}` : ""}
                    </span>
                  </p>
                )}
              </div>

              <div className="shrink-0">
                {status === "not_checked_in" && (
                  <button onClick={() => handleCheckIn(p)} className="btn-primary text-sm">Check in</button>
                )}
                {status === "checked_in" && (
                  <button onClick={() => handleCheckOut(p)} className="btn-signal text-sm">Check out</button>
                )}
                {status === "checked_out" && (
                  <span className="text-xs text-success bg-success/10 px-3 py-2 rounded-lg font-medium">Done for today</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function formatTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
