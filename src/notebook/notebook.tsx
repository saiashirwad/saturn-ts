import { use$ } from "@legendapp/state/react"
import * as React from "react"
import { CommandPalette } from "../command/command-palette"
import { useKeyboardNav } from "../keyboard/use-keyboard-nav"
import { CodeCell } from "./code-cell"
import { addCell, notebook$ } from "./notebook-store"

export function Notebook() {
  return (
    <div
      className="min-h-screen bg-background text-foreground"
      role="main"
      aria-label="Notebook editor"
    >
      <CommandPalette />
      <TopBar />
      <Editor />
    </div>
  )
}

function TopBar() {
  return (
    <div className="flex items-center justify-between px-2 py-1 border-b border-border">
      <div className="flex items-center gap-3">
        <button
          className="p-1 text-muted-foreground hover:text-foreground"
          onClick={() => addCell("reactive")}
          title="Add cell (⌘K)"
          aria-label="Add new code cell"
        >
          Reactive
        </button>
        <button
          className="p-1 text-muted-foreground hover:text-foreground"
          onClick={() => addCell("non-reactive")}
          title="Add cell (⌘K)"
          aria-label="Add new code cell"
        >
          Non-Reactive Cell
        </button>
      </div>
    </div>
  )
}

function Editor() {
  const cells = use$(notebook$.cells)
  const focusedCellId = use$(notebook$.focusedCellId)
  const cellRefs = React.useRef<Map<string, HTMLDivElement>>(new Map())

  useKeyboardNav()

  return (
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
  )
}
