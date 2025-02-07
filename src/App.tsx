import { initializeTheme } from "./lib/theme"
import { Notebook } from "./notebook/notebook"

initializeTheme()

function App() {
  return <Notebook />
}

export default App
