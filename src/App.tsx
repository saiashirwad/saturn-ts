import { Notebook } from "./notebook"
import { initializeTheme } from "./lib/theme"

initializeTheme()

function App() {
  return (
    <div>
      <Notebook />
    </div>
  )
}

export default App
