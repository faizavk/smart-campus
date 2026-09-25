import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import CampusAssistant from "./CampusAssistant";
import CommandPalette from "./CommandPalette";
import ThemeToggle from "./ThemeToggle";
import API from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function Layout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notes, setNotes] = useState([]);
  const [unread, setUnread] = useState(0);

  const loadNotes = async () => {
    try {
      const res = await API.get("/notifications");
      setNotes(res.data.notifications || []);
      setUnread(res.data.unread || 0);
    } catch {
      setNotes([]);
    }
  };

  useEffect(() => {
    loadNotes();
    const timer = setInterval(loadNotes, 20000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const onKey = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const openNotes = async () => {
    setOpen((v) => !v);
    if (!open && unread) {
      await API.patch("/notifications/read");
      setUnread(0);
    }
  };

  return (
    <div className="layout">
      <div className={`sidebar-scrim ${navOpen ? "show" : ""}`} onClick={() => setNavOpen(false)} />
      <Sidebar open={navOpen} onNavigate={() => setNavOpen(false)} />
      <div className="main">
        <header className="topbar">
          <div>
            <button type="button" className="menu-btn ghost" onClick={() => setNavOpen(true)}>
              Menu
            </button>
            <p className="eyebrow">Welcome back</p>
            <h1>{user?.name}</h1>
          </div>
          <div className="topbar-actions">
            <button type="button" className="ghost" onClick={() => setSearchOpen(true)}>
              Search <span className="kbd">Ctrl K</span>
            </button>
            <ThemeToggle compact />
            <span className={`role-badge ${user?.role}`}>{user?.role}</span>
            <button className="bell" onClick={openNotes}>
              Alerts
              {unread > 0 && <em>{unread}</em>}
            </button>
          </div>
        </header>

        {open && (
          <div className="note-drawer">
            {notes.length === 0 && <p className="muted">No notifications yet.</p>}
            {notes.map((note) => (
              <button
                key={note._id}
                className="note-item"
                onClick={() => {
                  setOpen(false);
                  navigate(note.link || "/");
                }}
              >
                <strong>{note.title}</strong>
                <span>{note.message}</span>
              </button>
            ))}
          </div>
        )}

        <div className="content">
          <Outlet />
        </div>
      </div>
      <CampusAssistant />
      <CommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
