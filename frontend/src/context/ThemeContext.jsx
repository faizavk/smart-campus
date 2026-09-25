import { createContext, useContext, useEffect, useMemo, useState } from "react";

const ThemeContext = createContext(null);

const resolve = (theme) => {
  if (theme === "system") {
    return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  }
  return theme;
};

export function applyTheme(theme) {
  const next = resolve(theme);
  document.documentElement.setAttribute("data-theme", next);
  document.documentElement.style.colorScheme = next;
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => localStorage.getItem("theme") || "dark");

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem("theme", theme);

    if (theme !== "system") return undefined;
    const media = window.matchMedia("(prefers-color-scheme: light)");
    const onChange = () => applyTheme("system");
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [theme]);

  const setTheme = (next) => setThemeState(next);
  const toggleTheme = () => {
    setThemeState((current) => (resolve(current) === "dark" ? "light" : "dark"));
  };

  const value = useMemo(
    () => ({ theme, resolved: resolve(theme), setTheme, toggleTheme }),
    [theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
