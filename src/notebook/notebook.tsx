import { useNotebookStore } from "./notebook-store"
import { CommandPalette } from "../command/command-palette"
import { CodeCell } from "./code-cell"

export function Notebook() {
  const cells = useNotebookStore((state) => state.cells)
  const addCell = useNotebookStore((state) => state.addCell)

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
          <CodeCell key={cell.id} cell={cell} index={index + 1} />
        ))}
      </div>
    </div>
  )
}
