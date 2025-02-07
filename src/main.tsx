import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { initializeTheme } from "./lib/theme"
import { Notebook } from "./notebook/notebook"
import { useDarkMode } from "./utils/use-dark-mode"
import "./index.css"
import { Playground } from "./playground"

initializeTheme()

function App() {
  useDarkMode()
  //return <Notebook />
  return <Playground />
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
