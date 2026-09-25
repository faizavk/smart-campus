import { useEffect, useState } from "react";
import API, { errorMessage } from "../services/api";
import { useAuth } from "../context/AuthContext";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function Timetable() {
  const { user } = useAuth();
  const [slots, setSlots] = useState([]);
  const [today, setToday] = useState("");
  const [courses, setCourses] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [form, setForm] = useState({
    course: "",
    faculty: "",
    day: "Monday",
    startTime: "10:00",
    endTime: "11:00",
    room: "",
  });
  const [message, setMessage] = useState("");

  const load = async () => {
    const res = await API.get("/timetable");
    setSlots(res.data.timetable || []);
    setToday(res.data.today || "");
  };

  useEffect(() => {
    load().catch(() => {});
    if (user?.role === "admin") {
      API.get("/courses").then((res) => setCourses(res.data.courses || []));
      API.get("/users?role=faculty").then((res) => setFaculty(res.data.users || []));
    }
  }, [user]);

  const create = async (e) => {
    e.preventDefault();
    try {
      await API.post("/timetable", form);
      setMessage("Slot added");
      load();
    } catch (err) {
      setMessage(errorMessage(err, "Conflict or invalid slot"));
    }
  };

  const remove = async (id) => {
    await API.delete(`/timetable/${id}`);
    load();
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <p className="eyebrow">This week · {today}</p>
          <h2>Timetable</h2>
        </div>
      </div>

      {user?.role === "admin" && (
        <form className="create-box" onSubmit={create}>
          <h3>Add slot</h3>
          <p className="muted">Smart Campus blocks overlapping faculty or room bookings.</p>
          <div className="form-grid">
            <select value={form.course} onChange={(e) => setForm({ ...form, course: e.target.value })} required>
              <option value="">Course</option>
              {courses.map((course) => (
                <option key={course._id} value={course._id}>
                  {course.title}
                </option>
              ))}
            </select>
            <select value={form.faculty} onChange={(e) => setForm({ ...form, faculty: e.target.value })} required>
              <option value="">Faculty</option>
              {faculty.map((person) => (
                <option key={person._id} value={person._id}>
                  {person.name}
                </option>
              ))}
            </select>
            <select value={form.day} onChange={(e) => setForm({ ...form, day: e.target.value })}>
              {DAYS.map((day) => (
                <option key={day}>{day}</option>
              ))}
            </select>
            <input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
            <input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
            <input
              placeholder="Room"
              value={form.room}
              onChange={(e) => setForm({ ...form, room: e.target.value })}
            />
          </div>
          <button type="submit">Add to timetable</button>
        </form>
      )}

      {message && <p className="flash">{message}</p>}

      <div className="timetable-grid">
        {DAYS.map((day) => (
          <section className={`panel ${day === today ? "today" : ""}`} key={day}>
            <h3>{day}</h3>
            {slots
              .filter((slot) => slot.day === day)
              .map((slot) => (
                <div className="row-item" key={slot._id}>
                  <div>
                    <strong>{slot.course?.title}</strong>
                    <p className="muted">
                      {slot.startTime}–{slot.endTime} · {slot.room || "TBA"} · {slot.faculty?.name}
                    </p>
                  </div>
                  {user?.role === "admin" && (
                    <button className="ghost" onClick={() => remove(slot._id)}>
                      Remove
                    </button>
                  )}
                </div>
              ))}
          </section>
        ))}
      </div>
    </div>
  );
}
