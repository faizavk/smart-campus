import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API, { errorMessage } from "../services/api";
import { useAuth } from "../context/AuthContext";
import ThemeToggle from "../components/ThemeToggle";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await API.post("/auth/login", { email, password });
      login(res.data.token, res.data.user);
      navigate("/");
    } catch (err) {
      setError(errorMessage(err, "Login failed"));
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-theme">
        <ThemeToggle />
      </div>
      <div className="auth-hero">
        <p className="eyebrow">MERN · Role-aware · Insight-driven</p>
        <h1>Run campus operations with a smart layer on top.</h1>
        <p>
          Live attendance codes, auto-prioritized helpdesk, eligibility risk alerts,
          and a campus copilot that answers from real data.
        </p>
      </div>
      <form className="auth-card" onSubmit={handleLogin}>
        <h2>Sign in</h2>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className="form-error">{error}</p>}
        <button type="submit">Enter campus</button>
        <p className="auth-foot">
          New here? <Link to="/register">Create an account</Link>
        </p>
        <p className="hint">Demo: student@campus.edu / campus123</p>
      </form>
    </div>
  );
}
