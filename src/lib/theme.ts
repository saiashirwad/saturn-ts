type Theme = "dark" | "light";

export function setTheme(theme: Theme) {
  if (theme === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
  // Only save to localStorage if it's a manual preference
  if (localStorage.getItem("theme")) {
    localStorage.setItem("theme", theme);
  }
}

export function initializeTheme() {
  const savedTheme = localStorage.getItem("theme") as Theme | null;
  const systemPrefersDark = window.matchMedia(
    "(prefers-color-scheme: dark)",
  ).matches;

  if (savedTheme) {
    setTheme(savedTheme);
  } else {
    setTheme(systemPrefersDark ? "dark" : "light");
    // Don't save system preference to localStorage
  }

  // Add listener for system theme changes
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  mediaQuery.addEventListener("change", (e) => {
    // Only update if no saved preference
    if (!localStorage.getItem("theme")) {
      setTheme(e.matches ? "dark" : "light");
    }
  });
}
