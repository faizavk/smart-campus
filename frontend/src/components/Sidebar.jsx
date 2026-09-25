import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const links = [
  { to: "/", label: "Dashboard", icon: "▣" },
  { to: "/courses", label: "Courses", icon: "⌘" },
  { to: "/assignments", label: "Assignments", icon: "✎" },
  { to: "/attendance", label: "Attendance", icon: "◉" },
  { to: "/timetable", label: "Timetable", icon: "▦" },
  { to: "/events", label: "Events", icon: "✦" },
  { to: "/notices", label: "Notices", icon: "✺" },
  { to: "/tickets", label: "Helpdesk", icon: "⚑" },
  { to: "/settings", label: "Settings", icon: "⚙" },
];

export default function Sidebar({ open, onNavigate }) {
  const { user, logout } = useAuth();

  return (
    <aside className={`sidebar ${open ? "open" : ""}`}>
      <div className="brand">
        <span className="brand-mark">SC</span>
        <div>
          <h2>Smart Campus</h2>
          <small>Intelligence layer</small>
        </div>
      </div>

      <nav>
        {links.map((link) => (
          <NavLink key={link.to} to={link.to} end={link.to === "/"} onClick={onNavigate}>
            <span>{link.icon}</span>
            {link.label}
          </NavLink>
        ))}
        {user?.role === "admin" && (
          <NavLink to="/users" onClick={onNavigate}>
            <span>☺</span>
            People
          </NavLink>
        )}
      </nav>

      <div className="sidebar-user">
        <div className="avatar">{user?.name?.[0] || "U"}</div>
        <div>
          <strong>{user?.name}</strong>
          <em>{user?.role}</em>
        </div>
      </div>

      <button className="logout-btn" onClick={logout}>
        Sign out
      </button>
    </aside>
  );
}
