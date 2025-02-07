import { initializeTheme } from "./lib/theme"
import { Notebook } from "./notebook/notebook"
import { useDarkMode } from "./utils/useDarkMode"

initializeTheme()

function App() {
  useDarkMode()
  return <Notebook />
}

export default App
