import { useEffect, useState } from "react";
import API, { errorMessage } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function Assignments() {
  const { user } = useAuth();
  const isFaculty = user?.role === "faculty";
  const [assignments, setAssignments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState({ title: "", description: "", dueDate: "", course: "", maxMarks: 100 });
  const [content, setContent] = useState({});
  const [openId, setOpenId] = useState("");
  const [subs, setSubs] = useState([]);
  const [message, setMessage] = useState("");

  const load = async () => {
    const [a, c] = await Promise.all([API.get("/assignments"), API.get("/courses?mine=true")]);
    setAssignments(a.data.assignments || []);
    setCourses(c.data.courses || []);
  };

  useEffect(() => {
    load().catch(() => {});
  }, []);

  const create = async (e) => {
    e.preventDefault();
    try {
      await API.post("/assignments", form);
      setForm({ title: "", description: "", dueDate: "", course: "", maxMarks: 100 });
      setMessage("Assignment published to enrolled students");
      load();
    } catch (err) {
      setMessage(errorMessage(err));
    }
  };

  const submit = async (id) => {
    try {
      await API.post(`/assignments/${id}/submit`, { content: content[id] });
      setMessage("Submitted");
      load();
    } catch (err) {
      setMessage(errorMessage(err));
    }
  };

  const viewSubs = async (id) => {
    const res = await API.get(`/assignments/${id}/submissions`);
    setOpenId(id);
    setSubs(res.data.submissions || []);
  };

  const grade = async (submissionId, grade, feedback) => {
    await API.patch(`/assignments/submissions/${submissionId}`, { grade, feedback });
    viewSubs(openId);
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <p className="eyebrow">Academics</p>
          <h2>Assignments</h2>
        </div>
      </div>

      {isFaculty && (
        <form className="create-box" onSubmit={create}>
          <h3>Create assignment</h3>
          <div className="form-grid">
            <input
              placeholder="Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
            <select
              value={form.course}
              onChange={(e) => setForm({ ...form, course: e.target.value })}
              required
            >
              <option value="">Select course</option>
              {courses.map((course) => (
                <option key={course._id} value={course._id}>
                  {course.title}
                </option>
              ))}
            </select>
            <input
              type="datetime-local"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              required
            />
            <input
              type="number"
              value={form.maxMarks}
              onChange={(e) => setForm({ ...form, maxMarks: e.target.value })}
            />
          </div>
          <textarea
            placeholder="Brief"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <button type="submit">Publish</button>
        </form>
      )}

      {message && <p className="flash">{message}</p>}

      <div className="cards">
        {assignments.map((item) => (
          <article className="card" key={item._id}>
            <div className="card-kicker">{item.course?.title}</div>
            <h3>{item.title}</h3>
            <p>{item.description}</p>
            <p className="muted">Due {item.dueDate ? new Date(item.dueDate).toLocaleString() : "TBA"}</p>

            {user?.role === "student" && !item.submission && (
              <>
                <textarea
                  placeholder="Paste your work or a drive link"
                  value={content[item._id] || ""}
                  onChange={(e) => setContent({ ...content, [item._id]: e.target.value })}
                />
                <button onClick={() => submit(item._id)}>Submit</button>
                {item.overdue && <p className="form-error">Deadline passed — late flag will apply.</p>}
              </>
            )}

            {item.submission && (
              <p className="muted">
                Submitted {item.submission.late ? "(late) " : ""}
                {item.submission.grade != null
                  ? `· Score ${item.submission.grade}`
                  : "· awaiting grade"}
              </p>
            )}

            {isFaculty && (
              <button className="ghost" onClick={() => viewSubs(item._id)}>
                Review submissions
              </button>
            )}
          </article>
        ))}
      </div>

      {openId && (
        <section className="panel">
          <h3>Submissions</h3>
          {subs.length === 0 && <p className="muted">None yet.</p>}
          {subs.map((sub) => (
            <GradeRow key={sub._id} sub={sub} onGrade={grade} />
          ))}
        </section>
      )}
    </div>
  );
}

function GradeRow({ sub, onGrade }) {
  const [grade, setGrade] = useState(sub.grade ?? "");
  const [feedback, setFeedback] = useState(sub.feedback || "");

  return (
    <div className="row-item">
      <div>
        <strong>{sub.student?.name}</strong>
        <p>{sub.content}</p>
        {sub.late && <span className="tag high">late</span>}
      </div>
      <div className="grade-box">
        <input type="number" value={grade} onChange={(e) => setGrade(e.target.value)} placeholder="Marks" />
        <input value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Feedback" />
        <button onClick={() => onGrade(sub._id, Number(grade), feedback)}>Save</button>
      </div>
    </div>
  );
}
