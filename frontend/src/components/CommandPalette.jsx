import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

const groups = [
  ["courses", "/courses"],
  ["assignments", "/assignments"],
  ["notices", "/notices"],
  ["tickets", "/tickets"],
  ["events", "/events"],
  ["people", "/users"],
];

export default function CommandPalette({ open, onClose }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open || query.trim().length < 2) {
      setResults(null);
      return undefined;
    }
    const timer = setTimeout(async () => {
      const res = await API.get(`/search?q=${encodeURIComponent(query)}`);
      setResults(res.data);
    }, 220);
    return () => clearTimeout(timer);
  }, [query, open]);

  if (!open) return null;

  const jump = (path) => {
    onClose();
    setQuery("");
    navigate(path);
  };

  return (
    <div className="search-scrim" onClick={onClose}>
      <div className="search-modal" onClick={(e) => e.stopPropagation()}>
        <input
          autoFocus
          className="search"
          placeholder="Search courses, events, tickets, people…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <p className="muted">Type at least 2 letters. Esc to close.</p>
        <div className="search-hits">
          {groups.map(([key, path]) => {
            const items = results?.[key] || [];
            if (!items.length) return null;
            return (
              <div key={key}>
                <p className="eyebrow">{key}</p>
                {items.map((item) => (
                  <button key={item._id} className="search-hit" onClick={() => jump(path)}>
                    <span>{item.title || item.name}</span>
                    <span className="muted">{item.code || item.role || item.status || ""}</span>
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
