import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api.js";

const MGMT_SUBTEAMS = [
  "CORE",
  "DOCUMENTATION",
  "WEBSITE",
  "PROMOTION",
  "SOCIAL_MEDIA_MARKETING",
  "FINANCE",
  "EVENT_MANAGEMENT",
];

const PRESET_POSITIONS = [
  "Finance",
  "Event Manager",
  "Lead",
  "Co-Lead",
  "Volunteer",
  "Team Lead",
  "Member",
];

const emptyForm = {
  person_type: "MANAGEMENT",
  full_name: "",
  class_year: "",
  enrollment_number: "",
  sub_team: "CORE",
  position: "",
  contact_number: "",
};

export default function Onboard() {
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'success'|'error'|'warning', text }
  const [duplicateInfo, setDuplicateInfo] = useState(null);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function switchType(type) {
    setForm({
      ...emptyForm,
      person_type: type,
      sub_team: type === "MANAGEMENT" ? "CORE" : "",
    });
    setMessage(null);
    setDuplicateInfo(null);
  }

  async function handleSubmit(e, confirmDuplicate = false) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);

    try {
      const data = await api.createPerson(form, confirmDuplicate);
      setMessage({
        type: "success",
        text: `Created ${data.person.full_name} (${data.person.unique_code})`,
      });
      setForm({
        ...emptyForm,
        person_type: form.person_type,
        sub_team: form.person_type === "MANAGEMENT" ? "CORE" : "",
      });
      setDuplicateInfo(null);
    } catch (err) {
      if (err.status === 409) {
        setDuplicateInfo(err.details);
        setMessage({ type: "warning", text: err.details.warning });
      } else {
        setMessage({ type: "error", text: err.message });
      }
    } finally {
      setBusy(false);
    }
  }

  const isManagement = form.person_type === "MANAGEMENT";

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link to="/" className="text-sm text-brand hover:underline mb-4 inline-block">
        ← Back to Dashboard
      </Link>
      <h1 className="font-display text-2xl font-semibold mb-1">
        Onboard a person
      </h1>
      <p className="text-ink/50 text-sm mb-6">
        First-time registration for the management team or an event participant.
      </p>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => switchType("MANAGEMENT")}
          className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
            isManagement
              ? "bg-brand text-white border-brand"
              : "border-black/10 text-ink/60 hover:bg-black/5"
          }`}
        >
          Management Team
        </button>
        <button
          onClick={() => switchType("PARTICIPANT")}
          className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
            !isManagement
              ? "bg-brand text-white border-brand"
              : "border-black/10 text-ink/60 hover:bg-black/5"
          }`}
        >
          Participant
        </button>
      </div>

      <form
        onSubmit={(e) => handleSubmit(e, false)}
        className="card p-6 space-y-4"
      >
        <div>
          <label className="label">Full name *</label>
          <input
            className="input"
            required
            value={form.full_name}
            onChange={(e) => update("full_name", e.target.value)}
          />
        </div>

        <div>
          <label className="label">Class / Year / Branch</label>
          <input
            className="input"
            placeholder='e.g. "TE Computer" or "2nd Year BBA"'
            value={form.class_year}
            onChange={(e) => update("class_year", e.target.value)}
          />
        </div>

        <div>
          <label className="label">Enrollment Number</label>
          <input
            className="input"
            placeholder="e.g. 210020123001 (optional)"
            value={form.enrollment_number}
            onChange={(e) => update("enrollment_number", e.target.value)}
          />
        </div>

        {isManagement ? (
          <div>
            <label className="label">Sub-team *</label>
            <select
              className="input"
              value={form.sub_team}
              onChange={(e) => update("sub_team", e.target.value)}
            >
              {MGMT_SUBTEAMS.map((t) => (
                <option key={t} value={t}>
                  {t.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div>
            <label className="label">Hackathon team name *</label>
            <input
              className="input"
              required
              placeholder="e.g. Team Rocket"
              value={form.sub_team}
              onChange={(e) => update("sub_team", e.target.value)}
            />
          </div>
        )}

        <div>
          <label className="label">Position / Role</label>
          <input
            className="input"
            list="position-suggestions"
            placeholder={
              isManagement
                ? "e.g. Finance, Event Manager, Lead, Volunteer"
                : "e.g. Team Lead, Member"
            }
            value={form.position}
            onChange={(e) => update("position", e.target.value)}
          />
          <datalist id="position-suggestions">
            {PRESET_POSITIONS.map((pos) => (
              <option key={pos} value={pos} />
            ))}
          </datalist>

          <div className="flex flex-wrap gap-1.5 mt-2">
            {PRESET_POSITIONS.map((pos) => (
              <button
                key={pos}
                type="button"
                onClick={() => update("position", pos)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                  form.position === pos
                    ? "bg-brand text-white border-brand font-medium"
                    : "border-black/10 text-ink/60 hover:bg-black/5"
                }`}
              >
                + {pos}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label">Contact number</label>
          <input
            className="input"
            value={form.contact_number}
            onChange={(e) => update("contact_number", e.target.value)}
          />
        </div>

        {message && (
          <div
            className={`text-sm rounded-lg px-3 py-2 ${
              message.type === "success"
                ? "bg-success/10 text-success"
                : message.type === "warning"
                  ? "bg-signal/10 text-signal-dark"
                  : "bg-danger/10 text-danger"
            }`}
          >
            {message.text}
          </div>
        )}

        {duplicateInfo && (
          <button
            type="button"
            onClick={(e) => handleSubmit(e, true)}
            className="btn-outline w-full text-sm"
          >
            Add anyway — this is a different person
          </button>
        )}

        <button type="submit" disabled={busy} className="btn-primary w-full">
          {busy ? "Saving…" : "Add person"}
        </button>
      </form>
    </div>
  );
}
