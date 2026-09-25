import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import API from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

const COLORS = ["#38bdf8", "#818cf8", "#34d399", "#fbbf24", "#f87171", "#c084fc"];

export default function Dashboard() {
  const { user } = useAuth();
  const { resolved } = useTheme();
  const [data, setData] = useState(null);
  const axis = resolved === "light" ? "#5b6b82" : "#94a3b8";
  const grid = resolved === "light" ? "#e2e8f0" : "#1e293b";

  useEffect(() => {
    API.get("/insights")
      .then((res) => setData(res.data))
      .catch(() => setData(null));
  }, []);

  if (!data) {
    return (
      <div className="cards">
        <div className="skeleton" />
        <div className="skeleton" />
        <div className="skeleton" />
      </div>
    );
  }

  const categoryData = Object.entries(data.ticketsByCategory || {}).map(([name, value]) => ({
    name,
    value,
  }));
  const enrollment = data.enrollment || [];
  const attendanceBars = (data.attendance || []).map((item) => ({
    name: item.course,
    value: item.percentage,
  }));

  return (
    <div>
      <div className="page-head">
        <div>
          <p className="eyebrow">Campus intelligence</p>
          <h2>{user.role === "admin" ? "Operations overview" : `${user.role} command center`}</h2>
        </div>
      </div>

      <div className="stats">
        {Object.entries(data.stats || {}).map(([key, value]) => (
          <article className="stat-card" key={key}>
            <span>{key.replace(/([A-Z])/g, " $1")}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </div>

      <div className="cards">
        {(data.insights || []).map((insight) => (
          <article className={`card insight ${insight.tone}`} key={insight.title}>
            <p className="eyebrow">{insight.tone}</p>
            <h3>{insight.title}</h3>
            <p>{insight.body}</p>
          </article>
        ))}
      </div>

      {user.role === "student" && (
        <div className="split">
          <section className="panel">
            <h3>Attendance by course</h3>
            <div className="chart-box">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={attendanceBars}>
                  <CartesianGrid strokeDasharray="3 3" stroke={grid} />
                  <XAxis dataKey="name" stroke={axis} />
                  <YAxis stroke={axis} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#38bdf8" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
          <section className="panel">
            <h3>Today's classes</h3>
            {(data.todaySchedule || []).length === 0 && <p className="muted">No classes listed for today.</p>}
            {(data.todaySchedule || []).map((slot) => (
              <div className="row-item" key={slot._id}>
                <strong>{slot.course?.title}</strong>
                <span>
                  {slot.startTime} – {slot.endTime} · {slot.room || "Room TBA"}
                </span>
              </div>
            ))}
          </section>
        </div>
      )}

      {user.role === "faculty" && (
        <div className="split">
          <section className="panel">
            <h3>At-risk students</h3>
            {(data.atRiskStudents || []).length === 0 && <p className="muted">Nobody is below 75% right now.</p>}
            {(data.atRiskStudents || []).map((item, index) => (
              <div className="row-item" key={index}>
                <strong>{item.student.name}</strong>
                <span>
                  {item.course} · {item.percentage}%
                </span>
              </div>
            ))}
          </section>
          <section className="panel">
            <h3>Needs grading</h3>
            {(data.pendingGrading || []).length === 0 && <p className="muted">All caught up.</p>}
            {(data.pendingGrading || []).map((item) => (
              <div className="row-item" key={item._id}>
                <strong>{item.student?.name}</strong>
                <span>{item.assignment?.title}</span>
              </div>
            ))}
          </section>
        </div>
      )}

      {user.role === "admin" && (
        <div className="split">
          <section className="panel">
            <h3>Enrollment load</h3>
            <div className="chart-box">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={enrollment}>
                  <CartesianGrid strokeDasharray="3 3" stroke={grid} />
                  <XAxis dataKey="name" stroke={axis} />
                  <YAxis stroke={axis} />
                  <Tooltip />
                  <Bar dataKey="students" fill="#818cf8" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
          <section className="panel">
            <h3>Tickets by category</h3>
            <div className="chart-box">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={categoryData} dataKey="value" nameKey="name" outerRadius={90} label>
                    {categoryData.map((entry, index) => (
                      <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
