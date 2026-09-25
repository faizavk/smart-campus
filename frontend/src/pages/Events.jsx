import { useEffect, useState } from "react";
import API, { errorMessage } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import EmptyState from "../components/EmptyState";

export default function Events() {
  const { user } = useAuth();
  const toast = useToast();
  const canPost = ["admin", "faculty"].includes(user?.role);
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    venue: "",
    startsAt: "",
    audience: "all",
  });

  const load = async () => {
    const res = await API.get("/events");
    setEvents(res.data.events || []);
  };

  useEffect(() => {
    load().catch(() => setEvents([]));
  }, []);

  const create = async (e) => {
    e.preventDefault();
    try {
      await API.post("/events", form);
      setForm({ title: "", description: "", venue: "", startsAt: "", audience: "all" });
      toast.push("Event published", "success");
      load();
    } catch (err) {
      toast.push(errorMessage(err), "danger");
    }
  };

  const rsvp = async (id) => {
    try {
      const res = await API.post(`/events/${id}/rsvp`);
      toast.push(res.data.message, "success");
      load();
    } catch (err) {
      toast.push(errorMessage(err), "danger");
    }
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <p className="eyebrow">Campus life</p>
          <h2>Events</h2>
          <p className="muted">RSVP so organizers can see who is coming. Notices stay for announcements; this is for things that happen.</p>
        </div>
      </div>

      {canPost && (
        <form className="create-box" onSubmit={create}>
          <h3>Create event</h3>
          <div className="form-grid">
            <input
              placeholder="Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
            <input
              placeholder="Venue"
              value={form.venue}
              onChange={(e) => setForm({ ...form, venue: e.target.value })}
            />
            <input
              type="datetime-local"
              value={form.startsAt}
              onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
              required
            />
            <select value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })}>
              <option value="all">Everyone</option>
              <option value="student">Students</option>
              <option value="faculty">Faculty</option>
            </select>
          </div>
          <textarea
            placeholder="What happens there?"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <button type="submit">Publish event</button>
        </form>
      )}

      {events.length === 0 ? (
        <EmptyState title="No events yet" body="When faculty or admin post one, it will show up here." />
      ) : (
        <div className="cards">
          {events.map((event) => (
            <article className="card" key={event._id}>
              <div className="tag-row">
                <span className="tag">{event.audience}</span>
                <span className="tag low">{event.attendees?.length || 0} going</span>
              </div>
              <h3>{event.title}</h3>
              <p>{event.description}</p>
              <p className="muted">
                {new Date(event.startsAt).toLocaleString()} · {event.venue || "Venue TBA"}
              </p>
              <button className={event.going ? "ghost" : ""} onClick={() => rsvp(event._id)}>
                {event.going ? "Can't go" : "I'm going"}
              </button>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
