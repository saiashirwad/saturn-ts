import { use$ } from "@legendapp/state/react"
import React from "react"
import { notebook$, setFocusedCell } from "../notebook/notebook-store"

export function useKeyboardNav() {
  const cells = use$(notebook$.cells)
  const focusedCellId = use$(notebook$.focusedCellId)

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
}
