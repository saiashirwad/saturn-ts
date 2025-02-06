type Theme = "dark" | "light"

export function setTheme(theme: Theme) {
  if (theme === "dark") {
    document.documentElement.classList.add("dark")
    localStorage.setItem("theme", "dark")
  } else {
    document.documentElement.classList.remove("dark")
    localStorage.setItem("theme", "light")
  }
}

export function initializeTheme() {
  // Check if theme is set in localStorage
  const savedTheme = localStorage.getItem("theme") as Theme | null

  // Check system preference
  const systemPrefersDark = window.matchMedia(
    "(prefers-color-scheme: dark)",
  ).matches

  // Apply theme
  if (savedTheme) {
    setTheme(savedTheme)
  } else if (systemPrefersDark) {
    setTheme("dark")
  } else {
    setTheme("light")
  }
}
