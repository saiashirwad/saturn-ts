import { use$ } from "@legendapp/state/react"
import * as React from "react"
import { CommandPalette } from "../command/command-palette"
import { useDarkMode } from "../utils/useDarkMode"
import { CodeCell } from "./code-cell"
import { addCell, notebook$, setFocusedCell } from "./notebook-store"

export function Notebook() {
  const cells = use$(notebook$.cells)
  const focusedCellId = use$(notebook$.focusedCellId)
  useDarkMode()

  const cellRefs = React.useRef<Map<string, HTMLDivElement>>(new Map())

  // Handle keyboard navigation
  const handleKeyDown = React.useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "ArrowUp" && e.ctrlKey) {
        e.preventDefault()
        const currentIndex = cells.findIndex(
          (cell) => cell.id === focusedCellId,
        )
        if (currentIndex > 0) {
          setFocusedCell(cells[currentIndex - 1].id)
        }
      } else if (e.key === "ArrowDown" && e.ctrlKey) {
        e.preventDefault()
        const currentIndex = cells.findIndex(
          (cell) => cell.id === focusedCellId,
        )
        if (currentIndex < cells.length - 1) {
          setFocusedCell(cells[currentIndex + 1].id)
        }
      }
    },
    [cells, focusedCellId],
  )

  React.useEffect(() => {
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])

  return (
    <div
      className="min-h-screen bg-background text-foreground"
      role="main"
      aria-label="Notebook editor"
    >
      <CommandPalette />
      <div className="flex items-center justify-between px-2 py-1 border-b border-border">
        <button
          className="p-1 text-muted-foreground hover:text-foreground"
          onClick={() => addCell("code")}
          title="Add cell (⌘K)"
          aria-label="Add new code cell"
        >
          +
        </button>
      </div>

      <div
        className="flex flex-col w-full"
        role="list"
        aria-label="Notebook cells"
      >
        {cells.map((cell, index) => (
          <div key={cell.id} role="listitem">
            <CodeCell
              ref={(el) => {
                if (el) {
                  cellRefs.current.set(cell.id, el)
                }
              }}
              cell={cell}
              index={index + 1}
              isFocused={focusedCellId === cell.id}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
