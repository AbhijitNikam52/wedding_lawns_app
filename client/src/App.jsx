import { Routes, Route } from "react-router-dom";

import Navbar       from "./components/layout/Navbar";
import Footer       from "./components/layout/Footer";
import PrivateRoute from "./components/PrivateRoute";

// Pages
import HomePage    from "./pages/HomePage";
import LoginPage   from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import {
  LawnListPage,
  LawnDetailPage,
  MyBookingsPage,
  ChatPage,
  OwnerDashboardPage,
  AdminPage,
  NotFoundPage,
} from "./pages/PlaceholderPages";

const App = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-grow">
        <Routes>
          {/* ── Public Routes ─────────────────────────── */}
          <Route path="/"          element={<HomePage />} />
          <Route path="/login"     element={<LoginPage />} />
          <Route path="/register"  element={<RegisterPage />} />
          <Route path="/lawns"     element={<LawnListPage />} />
          <Route path="/lawns/:id" element={<LawnDetailPage />} />

          {/* ── User Protected Routes ─────────────────── */}
          <Route
            path="/bookings/my"
            element={
              <PrivateRoute>
                <MyBookingsPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/chat/:lawnId"
            element={
              <PrivateRoute>
                <ChatPage />
              </PrivateRoute>
            }
          />

          {/* ── Owner Protected Routes ────────────────── */}
          <Route
            path="/dashboard/owner"
            element={
              <PrivateRoute role="owner">
                <OwnerDashboardPage />
              </PrivateRoute>
            }
          />

          {/* ── Admin Protected Routes ────────────────── */}
          <Route
            path="/admin"
            element={
              <PrivateRoute role="admin">
                <AdminPage />
              </PrivateRoute>
            }
          />

          {/* ── 404 ──────────────────────────────────── */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
};

export default App;
