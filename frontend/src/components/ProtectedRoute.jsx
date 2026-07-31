import { Navigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext.jsx";

export default function ProtectedRoute({ children }) {
  const { admin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-ink/50 font-mono text-sm">
        Loading…
      </div>
    );
  }
  if (!admin) return <Navigate to="/login" replace />;
  return children;
}
