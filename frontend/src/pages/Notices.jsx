import { useEffect, useState } from "react";
import API, { errorMessage } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function Notices() {
  const { user } = useAuth();
  const canPost = ["admin", "faculty"].includes(user?.role);
  const [notices, setNotices] = useState([]);
  const [form, setForm] = useState({ title: "", content: "", audience: "all", pinned: false });
  const [message, setMessage] = useState("");

  const load = async () => {
    const res = await API.get("/notices");
    setNotices(res.data.notices || []);
  };

  useEffect(() => {
    load().catch(() => {});
  }, []);

  const create = async (e) => {
    e.preventDefault();
    try {
      await API.post("/notices", form);
      setForm({ title: "", content: "", audience: "all", pinned: false });
      setMessage("Notice posted and pushed to inboxes");
      load();
    } catch (err) {
      setMessage(errorMessage(err));
    }
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <p className="eyebrow">Announcements</p>
          <h2>Notices</h2>
        </div>
      </div>

      {canPost && (
        <form className="create-box" onSubmit={create}>
          <h3>Post notice</h3>
          <input
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
          <textarea
            placeholder="Content"
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            required
          />
          <div className="form-grid">
            <select value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })}>
              <option value="all">Everyone</option>
              <option value="student">Students</option>
              <option value="faculty">Faculty</option>
            </select>
            <label className="check">
              <input
                type="checkbox"
                checked={form.pinned}
                onChange={(e) => setForm({ ...form, pinned: e.target.checked })}
              />
              Pin to top
            </label>
          </div>
          <button type="submit">Publish</button>
        </form>
      )}

      {message && <p className="flash">{message}</p>}

      <div className="cards">
        {notices.map((notice) => (
          <article className="card" key={notice._id}>
            <div className="tag-row">
              {notice.pinned && <span className="tag high">pinned</span>}
              <span className="tag">{notice.audience}</span>
            </div>
            <h3>{notice.title}</h3>
            <p>{notice.content}</p>
            <p className="muted">
              {notice.postedBy?.name} · {new Date(notice.createdAt).toLocaleString()}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
