import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./lib/AuthContext.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Navbar from "./components/Navbar.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Onboard from "./pages/Onboard.jsx";
import CheckInOut from "./pages/CheckInOut.jsx";
import Reports from "./pages/Reports.jsx";

function Shell({ children }) {
  return (
    <div className="min-h-screen">
      <Navbar />
      {children}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Shell><Dashboard /></Shell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/onboard"
            element={
              <ProtectedRoute>
                <Shell><Onboard /></Shell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/check-in-out"
            element={
              <ProtectedRoute>
                <Shell><CheckInOut /></Shell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <Shell><Reports /></Shell>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
