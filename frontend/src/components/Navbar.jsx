import { NavLink } from "react-router-dom";
import { useAuth } from "../lib/AuthContext.jsx";

const links = [
  { to: "/", label: "Dashboard" },
  { to: "/check-in-out", label: "Check-In / Out" },
  { to: "/onboard", label: "Onboard" },
  { to: "/reports", label: "Reports" },
];

export default function Navbar() {
  const { admin, logout } = useAuth();

  return (
    <header className="bg-ink text-white sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-16">
        <div className="flex items-center gap-8">
          <span className="font-display font-semibold text-lg tracking-tight">
            Buzz<span className="text-signal">Tech</span>
          </span>
          <nav className="hidden sm:flex gap-1">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === "/"}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive ? "bg-white/10 text-white" : "text-white/60 hover:text-white hover:bg-white/5"
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:block text-sm text-white/50 font-mono">{admin?.name}</span>
          <button onClick={logout} className="text-sm text-white/70 hover:text-white">
            Log out
          </button>
        </div>
      </div>
      <nav className="sm:hidden flex gap-1 px-4 pb-2 overflow-x-auto">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.to === "/"}
            className={({ isActive }) =>
              `px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap ${
                isActive ? "bg-white/10 text-white" : "text-white/60"
              }`
            }
          >
            {l.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
