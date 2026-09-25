import { useEffect, useState } from "react";
import API, { errorMessage } from "../services/api";
import { useAuth } from "../context/AuthContext";
import EmptyState from "../components/EmptyState";

export default function Courses() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ title: "", description: "", code: "", department: "", credits: 3 });
  const [message, setMessage] = useState("");

  const fetchCourses = async () => {
    const res = await API.get(`/courses?search=${search}`);
    setCourses(res.data.courses || []);
  };

  useEffect(() => {
    fetchCourses().catch(() => setCourses([]));
  }, [search]);

  const createCourse = async (e) => {
    e.preventDefault();
    try {
      await API.post("/courses", form);
      setForm({ title: "", description: "", code: "", department: "", credits: 3 });
      setMessage("Course published");
      fetchCourses();
    } catch (err) {
      setMessage(errorMessage(err, "Could not create course"));
    }
  };

  const toggleEnroll = async (course) => {
    try {
      await API.post(`/courses/${course._id}/${course.enrolled ? "unenroll" : "enroll"}`);
      fetchCourses();
    } catch (err) {
      setMessage(errorMessage(err));
    }
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <p className="eyebrow">Catalog</p>
          <h2>Courses</h2>
        </div>
      </div>

      <input
        className="search"
        placeholder="Search title, code or department"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {["faculty", "admin"].includes(user?.role) && (
        <form className="create-box" onSubmit={createCourse}>
          <h3>Create course</h3>
          <div className="form-grid">
            <input
              placeholder="Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
            <input
              placeholder="Code (optional)"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
            />
            <input
              placeholder="Department"
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
            />
            <input
              type="number"
              min="1"
              placeholder="Credits"
              value={form.credits}
              onChange={(e) => setForm({ ...form, credits: e.target.value })}
            />
          </div>
          <textarea
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <button type="submit">Publish course</button>
        </form>
      )}

      {message && <p className="flash">{message}</p>}

      {courses.length === 0 ? (
        <EmptyState title="No courses found" body="Try another search, or ask faculty to publish one." />
      ) : (
      <div className="cards">
        {courses.map((course) => (
          <article className="card" key={course._id}>
            <div className="card-kicker">{course.code || "COURSE"}</div>
            <h3>{course.title}</h3>
            <p>{course.description}</p>
            <p className="muted">
              {course.faculty?.name || "Faculty TBA"} · {course.students?.length || 0} enrolled · {course.credits} cr
            </p>
            {user?.role === "student" && (
              <button className={course.enrolled ? "ghost" : ""} onClick={() => toggleEnroll(course)}>
                {course.enrolled ? "Leave course" : "Enroll"}
              </button>
            )}
          </article>
        ))}
      </div>
      )}
    </div>
  );
}
