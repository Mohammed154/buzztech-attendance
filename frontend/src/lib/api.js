const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function getToken() {
  return localStorage.getItem("buzztech_token");
}

async function request(path, { method = "GET", body, isRaw = false } = {}) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (isRaw) return res; // caller handles (e.g. CSV download)

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(data.error || "Request failed");
    error.details = data;
    error.status = res.status;
    throw error;
  }
  return data;
}

export const api = {
  login: (email, password) =>
    request("/auth/login", { method: "POST", body: { email, password } }),
  me: () => request("/auth/me"),

  listPeople: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/people${qs ? `?${qs}` : ""}`);
  },
  createPerson: (payload, confirm = false) =>
    request(`/people${confirm ? "?confirm=true" : ""}`, {
      method: "POST",
      body: payload,
    }),
  updatePerson: (id, payload) =>
    request(`/people/${id}`, { method: "PATCH", body: payload }),

  todayAttendance: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/attendance/today${qs ? `?${qs}` : ""}`);
  },
  checkIn: (person_id, force = false) =>
    request("/attendance/check-in", {
      method: "POST",
      body: { person_id, force },
    }),
  checkOut: (person_id, force = false) =>
    request("/attendance/check-out", {
      method: "POST",
      body: { person_id, force },
    }),

  report: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/reports${qs ? `?${qs}` : ""}`);
  },
  // in api.js, add this alongside the other exported functions
  exportCsv: async (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    const res = await request(`/reports/export.csv${qs ? `?${qs}` : ""}`, {
      isRaw: true,
    });
    if (!res.ok) throw new Error("Failed to export CSV");
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `buzztech_attendance_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },
  summary: () => request("/reports/summary"),
};

export { getToken };
