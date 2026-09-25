import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { ToastProvider } from "./context/ToastContext";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Courses from "./pages/Courses";
import Tickets from "./pages/Tickets";
import Assignments from "./pages/Assignments";
import Attendance from "./pages/Attendance";
import Timetable from "./pages/Timetable";
import Notices from "./pages/Notices";
import Users from "./pages/Users";
import Events from "./pages/Events";
import Settings from "./pages/Settings";

function PublicOnly() {
  const { isAuth } = useAuth();
  return isAuth ? <Navigate to="/" replace /> : <Outlet />;
}

function Protected() {
  const { isAuth } = useAuth();
  return isAuth ? <Outlet /> : <Navigate to="/login" replace />;
}

function AdminOnly() {
  const { user } = useAuth();
  return user?.role === "admin" ? <Outlet /> : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<PublicOnly />}>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
              </Route>

              <Route element={<Protected />}>
                <Route element={<Layout />}>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/courses" element={<Courses />} />
                  <Route path="/tickets" element={<Tickets />} />
                  <Route path="/assignments" element={<Assignments />} />
                  <Route path="/attendance" element={<Attendance />} />
                  <Route path="/timetable" element={<Timetable />} />
                  <Route path="/events" element={<Events />} />
                  <Route path="/notices" element={<Notices />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route element={<AdminOnly />}>
                    <Route path="/users" element={<Users />} />
                  </Route>
                </Route>
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
