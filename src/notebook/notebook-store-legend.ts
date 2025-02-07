import { observable } from "@legendapp/state"
import { createId } from "@paralleldrive/cuid2"

export interface Cell {
  id: string
  type: "code" | "markdown"
  content: string
  output: Record<string, any>
  executionCount: number | null
  error: string | null
}

interface NotebookState {
  cells: Cell[]
  selectedCellId: string | null
  globalObject: Record<string, any>
  focusedCellId: string | null
  setFocusedCell: (id: string | null) => void
}

type NotebookStore = NotebookState & {
  addCell: (type: "code" | "markdown", belowId?: string) => void
  deleteCell: (id: string) => void
  updateCellContent: (id: string, content: string) => void
  updateCellOutput: (id: string, output: string, executionCount: number) => void
  setCellError: (id: string, error: string) => void
  selectCell: (id: string) => void
  moveCellUp: (id: string) => void
  moveCellDown: (id: string) => void
  updateCell: (id: string, cell: Partial<Cell>) => void
  updateGlobalObject: (globalObject: Record<string, any>) => void
  setGlobalObject: (globalObject: Record<string, any>) => void
}

export const notebook$ = observable<NotebookStore>({
  cells: [],
  selectedCellId: null,
  globalObject: {},
  focusedCellId: null,
  setFocusedCell: (id) => notebook$.focusedCellId.set(id),
  addCell: (type, belowId) => {
    const newCell: Cell = {
      id: createId(),
      type,
      content: "",
      output: {},
      executionCount: null,
      error: null,
    }

    const cells = notebook$.cells.peek()
    const index = belowId ? cells.findIndex((c) => c.id === belowId) : -1

    if (index !== -1) {
      notebook$.cells.splice(index + 1, 0, newCell)
    } else {
      notebook$.cells.push(newCell)
    }
    notebook$.selectedCellId.set(newCell.id)
  },

  deleteCell: (id) => {
    const cells = notebook$.cells.peek()
    const index = cells.findIndex((c) => c.id === id)
    if (index !== -1) {
      notebook$.cells.splice(index, 1)
    }
    if (notebook$.selectedCellId.peek() === id) {
      notebook$.selectedCellId.set(null)
    }
  },

  updateCellContent: (id, content) => {
    const cells = notebook$.cells.peek()
    const cell = cells.findIndex((c) => c.id === id)
    if (cell !== -1) {
      notebook$.cells[cell].content.set(content)
      notebook$.cells[cell].error.set(null)
    }
  },

  updateCellOutput: (id, output, executionCount) => {
    const cells = notebook$.cells.peek()
    const cell = cells.findIndex((c) => c.id === id)
    if (cell !== -1) {
      notebook$.cells[cell].output.set(JSON.parse(output))
      notebook$.cells[cell].executionCount.set(executionCount)
      notebook$.cells[cell].error.set(null)
    }
  },

  setCellError: (id, error) => {
    const cells = notebook$.cells.peek()
    const cell = cells.findIndex((c) => c.id === id)
    if (cell !== -1) {
      notebook$.cells[cell].error.set(error)
    }
  },

  selectCell: (id) => {
    notebook$.selectedCellId.set(id)
  },

  moveCellUp: (id) => {
    const cells = notebook$.cells.peek()
    const index = cells.findIndex((c) => c.id === id)
    if (index > 0) {
      const [moved] = notebook$.cells.splice(index, 1)
      notebook$.cells.splice(index - 1, 0, moved)
    }
  },

  moveCellDown: (id) => {
    const cells = notebook$.cells.peek()
    const index = cells.findIndex((c) => c.id === id)
    if (index < cells.length - 1) {
      const [moved] = notebook$.cells.splice(index, 1)
      notebook$.cells.splice(index + 1, 0, moved)
    }
  },

  updateCell: (id, cell) => {
    const index = notebook$.cells.peek().findIndex((c) => c.id === id)
    if (index !== -1) {
      notebook$.cells[index].set({ ...notebook$.cells[index].peek(), ...cell })
    }
  },

  updateGlobalObject: (globalObject: Record<string, any>) => {
    for (const [key, value] of Object.entries(globalObject)) {
      notebook$.globalObject[key].set(value)
    }
  },

  setGlobalObject: (globalObject: Record<string, any>) => {
    notebook$.globalObject.set(globalObject)
  },
})
// )
