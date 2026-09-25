import { useState } from "react";
import API, { errorMessage } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useToast } from "../context/ToastContext";

const options = [
  { id: "light", title: "Light", body: "Bright surfaces, easier outdoors." },
  { id: "dark", title: "Dark", body: "Low glare for late study sessions." },
  { id: "system", title: "System", body: "Follow this device automatically." },
];

export default function Settings() {
  const { user, login, token } = useAuth();
  const { theme, setTheme } = useTheme();
  const toast = useToast();
  const [form, setForm] = useState({
    name: user?.name || "",
    department: user?.department || "",
  });

  const save = async (e) => {
    e.preventDefault();
    try {
      const res = await API.patch("/users/me", form);
      login(token, res.data.user);
      toast.push("Profile saved", "success");
    } catch (err) {
      toast.push(errorMessage(err), "danger");
    }
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <p className="eyebrow">Preferences</p>
          <h2>Settings</h2>
        </div>
      </div>

      <section className="panel">
        <h3>Appearance</h3>
        <p className="muted">Theme applies to every screen, including login and the campus copilot.</p>
        <div className="theme-cards">
          {options.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`theme-card ${theme === option.id ? "active" : ""}`}
              onClick={() => setTheme(option.id)}
            >
              <strong>{option.title}</strong>
              <p className="muted">{option.body}</p>
            </button>
          ))}
        </div>
      </section>

      <form className="create-box" onSubmit={save} style={{ marginTop: 16 }}>
        <h3>Profile</h3>
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Display name"
          required
        />
        <input
          value={form.department}
          onChange={(e) => setForm({ ...form, department: e.target.value })}
          placeholder="Department"
        />
        <p className="muted">{user?.email} · {user?.role}</p>
        <button type="submit">Save profile</button>
      </form>
    </div>
  );
}
