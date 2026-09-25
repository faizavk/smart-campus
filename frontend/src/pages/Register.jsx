import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API, { errorMessage } from "../services/api";
import ThemeToggle from "../components/ThemeToggle";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "student",
    department: "",
  });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await API.post("/auth/register", form);
      navigate("/login");
    } catch (err) {
      setError(errorMessage(err, "Registration failed"));
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-theme">
        <ThemeToggle />
      </div>
      <div className="auth-hero">
        <p className="eyebrow">Join Smart Campus</p>
        <h1>Students and faculty get role-specific workspaces from day one.</h1>
      </div>
      <form className="auth-card" onSubmit={handleRegister}>
        <h2>Create account</h2>
        <input name="name" placeholder="Full name" onChange={handleChange} required />
        <input name="email" type="email" placeholder="Email" onChange={handleChange} required />
        <input name="password" type="password" placeholder="Password" onChange={handleChange} required />
        <input name="department" placeholder="Department (optional)" onChange={handleChange} />
        <select name="role" value={form.role} onChange={handleChange}>
          <option value="student">Student</option>
          <option value="faculty">Faculty</option>
        </select>
        {error && <p className="form-error">{error}</p>}
        <button type="submit">Register</button>
        <p className="auth-foot">
          Already enrolled? <Link to="/login">Sign in</Link>
        </p>
      </form>
    </div>
  );
}
