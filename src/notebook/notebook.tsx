import * as React from "react"
import { CommandPalette } from "../command/command-palette"
import { CodeCell } from "./code-cell"
import { useNotebookStore } from "./notebook-store"

export function Notebook() {
  const cells = useNotebookStore((state) => state.cells)
  const addCell = useNotebookStore((state) => state.addCell)
  const focusedCellId = useNotebookStore((state) => state.focusedCellId)

  // Create a ref map for all cells
  const cellRefs = React.useRef<Map<string, HTMLDivElement>>(new Map())

  // Effect to handle focusing when focusedCellId changes
  React.useEffect(() => {
    if (focusedCellId) {
      const element = cellRefs.current.get(focusedCellId)
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" })
      }
    }
  }, [focusedCellId])

  return (
    <div className="min-h-screen bg-white dark:bg-[#1e1e1e] text-gray-800 dark:text-gray-300">
      <CommandPalette />
      <div className="flex items-center justify-between px-2 py-1 border-b border-gray-200 dark:border-gray-700">
        <button
          className="p-1 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
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
