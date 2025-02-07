import { use$ } from "@legendapp/state/react"
import * as React from "react"
import { CommandPalette } from "../command/command-palette"
import { useDarkMode } from "../utils/useDarkMode"
import { CodeCell } from "./code-cell"
import { addCell, notebook$ } from "./notebook-store"

export function Notebook() {
  const cells = use$(notebook$.cells)
  const focusedCellId = use$(notebook$.focusedCellId)
  useDarkMode()

  const cellRefs = React.useRef<Map<string, HTMLDivElement>>(new Map())

  React.useEffect(() => {
    if (focusedCellId) {
      const element = cellRefs.current.get(focusedCellId)
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" })
      }
    }
  }, [focusedCellId])

  return (
    <div className="min-h-screen bg-background text-foreground">
      <CommandPalette />
      <div className="flex items-center justify-between px-2 py-1 border-b border-border">
        <button
          className="p-1 text-muted-foreground hover:text-foreground"
          onClick={() => addCell("code")}
          title="Add cell (⌘K)"
        >
          +
        </button>
      </div>

      <div className="flex flex-col w-full">
        {cells.map((cell, index) => (
          <CodeCell
            key={cell.id}
            cell={cell}
            index={index + 1}
            isFocused={focusedCellId === cell.id}
          />
        ))}
      </div>
    </div>
  )
}
