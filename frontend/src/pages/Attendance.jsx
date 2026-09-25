import { useEffect, useState } from "react";
import API, { errorMessage } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function Attendance() {
  const { user } = useAuth();
  const isStudent = user?.role === "student";

  if (isStudent) return <StudentAttendance />;
  return <FacultyAttendance />;
}

function StudentAttendance() {
  const [summary, setSummary] = useState([]);
  const [records, setRecords] = useState([]);
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");

  const load = async () => {
    const [s, r] = await Promise.all([API.get("/attendance/summary"), API.get("/attendance/my")]);
    setSummary(s.data.summary || []);
    setRecords(r.data.records || []);
  };

  useEffect(() => {
    load().catch(() => {});
  }, []);

  const checkIn = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post("/attendance/checkin", { code });
      setMessage(res.data.message);
      setCode("");
      load();
    } catch (err) {
      setMessage(errorMessage(err));
    }
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <p className="eyebrow">Live + historical</p>
          <h2>Attendance</h2>
        </div>
      </div>

      <form className="create-box" onSubmit={checkIn}>
        <h3>Join live session</h3>
        <p className="muted">Enter the 6-digit code your faculty is projecting. It expires in 10 minutes.</p>
        <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="123456" maxLength={6} />
        <button type="submit">Check in</button>
      </form>

      {message && <p className="flash">{message}</p>}

      <div className="cards">
        {summary.map((item) => (
          <article className={`card ${item.atRisk ? "insight danger" : ""}`} key={item.courseId}>
            <h3>{item.course}</h3>
            <strong className="big-number">{item.percentage}%</strong>
            <p className="muted">
              {item.present}/{item.total} present {item.atRisk ? "· below 75% risk line" : ""}
            </p>
          </article>
        ))}
      </div>

      <section className="panel">
        <h3>Recent register</h3>
        {records.map((record) => (
          <div className="row-item" key={record._id}>
            <strong>{record.course?.title}</strong>
            <span>
              {new Date(record.date).toLocaleDateString()} · {record.status} · {record.method}
            </span>
          </div>
        ))}
      </section>
    </div>
  );
}

function FacultyAttendance() {
  const [courses, setCourses] = useState([]);
  const [courseId, setCourseId] = useState("");
  const [students, setStudents] = useState([]);
  const [records, setRecords] = useState([]);
  const [marks, setMarks] = useState({});
  const [session, setSession] = useState(null);
  const [risk, setRisk] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    API.get("/courses?mine=true").then((res) => {
      setCourses(res.data.courses || []);
      if (res.data.courses?.[0]) setCourseId(res.data.courses[0]._id);
    });
    API.get("/attendance/risk").then((res) => setRisk(res.data.students || []));
  }, []);

  const loadCourse = async (id) => {
    if (!id) return;
    const res = await API.get(`/attendance/course/${id}`);
    setStudents(res.data.students || []);
    setRecords(res.data.records || []);
    const next = {};
    (res.data.students || []).forEach((student) => {
      const found = (res.data.records || []).find((item) => item.student?._id === student._id);
      next[student._id] = found?.status || "present";
    });
    setMarks(next);
  };

  useEffect(() => {
    loadCourse(courseId).catch(() => {});
  }, [courseId]);

  const startLive = async () => {
    try {
      const res = await API.post("/attendance/sessions", { course: courseId });
      setSession(res.data.session);
      setMessage("Share this code with the class. Students check in from Attendance.");
    } catch (err) {
      setMessage(errorMessage(err));
    }
  };

  const save = async () => {
    const payload = {
      course: courseId,
      records: Object.entries(marks).map(([student, status]) => ({ student, status })),
    };
    await API.post("/attendance/bulk", payload);
    setMessage("Register saved");
    loadCourse(courseId);
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <p className="eyebrow">Faculty tools</p>
          <h2>Attendance</h2>
        </div>
      </div>

      <div className="create-box">
        <select value={courseId} onChange={(e) => setCourseId(e.target.value)}>
          {courses.map((course) => (
            <option key={course._id} value={course._id}>
              {course.title}
            </option>
          ))}
        </select>
        <div className="action-row">
          <button type="button" onClick={startLive}>
            Start live 10-min code
          </button>
          <button type="button" className="ghost" onClick={save}>
            Save today's register
          </button>
        </div>
      </div>

      {session && (
        <article className="card live-code">
          <p className="eyebrow">Live session</p>
          <h2>{session.code}</h2>
          <p>Expires {new Date(session.expiresAt).toLocaleTimeString()}</p>
        </article>
      )}

      {message && <p className="flash">{message}</p>}

      <section className="panel">
        <h3>Today's roster</h3>
        {students.map((student) => (
          <div className="row-item" key={student._id}>
            <strong>{student.name}</strong>
            <select
              value={marks[student._id] || "present"}
              onChange={(e) => setMarks({ ...marks, [student._id]: e.target.value })}
            >
              <option value="present">Present</option>
              <option value="absent">Absent</option>
            </select>
          </div>
        ))}
      </section>

      <section className="panel">
        <h3>Eligibility risk (under 75%)</h3>
        {risk.length === 0 && <p className="muted">No at-risk students in your courses.</p>}
        {risk.map((item, index) => (
          <div className="row-item" key={index}>
            <strong>{item.student.name}</strong>
            <span>
              {item.course.title} · {item.percentage}%
            </span>
          </div>
        ))}
      </section>
    </div>
  );
}
