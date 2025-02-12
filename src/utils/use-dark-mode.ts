import { useState, useEffect } from "react";
import { setTheme as setThemeGlobal } from "../lib/theme";

export type Theme = "light" | "dark";

export function useDarkMode() {
  const [theme, setThemeState] = useState<Theme>(() => {
    // Check for saved theme first
    const savedTheme = localStorage.getItem("theme") as Theme | null;
    if (savedTheme) return savedTheme;

    // Otherwise use system preference
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  });

  // Apply theme changes
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setThemeState(newTheme);
    setThemeGlobal(newTheme);
    // Save to localStorage since this is a manual preference
    localStorage.setItem("theme", newTheme);
  };

  // Sync with system changes if no saved preference
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem("theme")) {
        const newTheme = e.matches ? "dark" : "light";
        setThemeState(newTheme);
        setThemeGlobal(newTheme);
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return { theme, toggleTheme };
}
