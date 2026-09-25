import { useTheme } from "../context/ThemeContext";

export default function ThemeToggle({ compact = false }) {
  const { resolved, toggleTheme } = useTheme();
  const isDark = resolved === "dark";

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
    >
      <span className="theme-icon">{isDark ? "☀" : "☾"}</span>
      {!compact && <span>{isDark ? "Light" : "Dark"}</span>}
    </button>
  );
}
