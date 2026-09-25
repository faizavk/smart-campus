import { useEffect, useState } from "react";
import API, { errorMessage } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function Tickets() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [tickets, setTickets] = useState([]);
  const [form, setForm] = useState({ title: "", description: "", category: "" });
  const [filter, setFilter] = useState("");
  const [message, setMessage] = useState("");

  const load = async () => {
    const url = isAdmin ? `/tickets${filter ? `?status=${filter}` : ""}` : "/tickets/my";
    const res = await API.get(url);
    setTickets(res.data.tickets || []);
  };

  useEffect(() => {
    load().catch(() => setTickets([]));
  }, [filter, isAdmin]);

  const create = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post("/tickets", form);
      setForm({ title: "", description: "", category: "" });
      setMessage(`Ticket filed as ${res.data.ticket.priority} priority`);
      load();
    } catch (err) {
      setMessage(errorMessage(err));
    }
  };

  const updateStatus = async (id, status) => {
    await API.patch(`/tickets/${id}`, { status });
    load();
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <p className="eyebrow">Smart helpdesk</p>
          <h2>Campus tickets</h2>
          <p className="muted">Priority is inferred from the wording — outage, exam, emergency, leak, and similar terms escalate automatically.</p>
        </div>
      </div>

      {!isAdmin && (
        <form className="create-box" onSubmit={create}>
          <h3>Report an issue</h3>
          <input
            placeholder="What's broken?"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
          <textarea
            placeholder="Details"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            <option value="">Auto-detect category</option>
            <option value="wifi">Wifi</option>
            <option value="lab">Lab</option>
            <option value="hostel">Hostel</option>
            <option value="library">Library</option>
            <option value="academics">Academics</option>
            <option value="other">Other</option>
          </select>
          <button type="submit">Submit ticket</button>
        </form>
      )}

      {isAdmin && (
        <div className="chip-row">
          {["", "open", "in-progress", "resolved"].map((value) => (
            <button key={value} className={filter === value ? "chip active" : "chip"} onClick={() => setFilter(value)}>
              {value || "all"}
            </button>
          ))}
        </div>
      )}

      {message && <p className="flash">{message}</p>}

      <div className="cards">
        {tickets.map((ticket) => (
          <article className="card" key={ticket._id}>
            <div className="tag-row">
              <span className={`tag ${ticket.priority}`}>{ticket.priority}</span>
              <span className="tag">{ticket.category}</span>
              <span className="tag">{ticket.status}</span>
            </div>
            <h3>{ticket.title}</h3>
            <p>{ticket.description}</p>
            {ticket.createdBy?.name && <p className="muted">Raised by {ticket.createdBy.name}</p>}
            {isAdmin && (
              <div className="action-row">
                {["open", "in-progress", "resolved"].map((status) => (
                  <button key={status} className="ghost" onClick={() => updateStatus(ticket._id, status)}>
                    {status}
                  </button>
                ))}
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
