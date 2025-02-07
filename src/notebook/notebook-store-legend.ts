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

const store$ = observable<NotebookStore>({
  cells: [],
  selectedCellId: null,
  globalObject: {},
  focusedCellId: null,
  setFocusedCell: (id) => store$.focusedCellId.set(id),
  addCell: (type, belowId) => {
    const newCell: Cell = {
      id: createId(),
      type,
      content: "",
      output: {},
      executionCount: null,
      error: null,
    }

    const cells = store$.cells.peek()
    const index = belowId ? cells.findIndex((c) => c.id === belowId) : -1

    if (index !== -1) {
      store$.cells.splice(index + 1, 0, newCell)
    } else {
      store$.cells.push(newCell)
    }
    store$.selectedCellId.set(newCell.id)
  },

  deleteCell: (id) => {
    const cells = store$.cells.peek()
    const index = cells.findIndex((c) => c.id === id)
    if (index !== -1) {
      store$.cells.splice(index, 1)
    }
    if (store$.selectedCellId.peek() === id) {
      store$.selectedCellId.set(null)
    }
  },

  updateCellContent: (id, content) => {
    const cells = store$.cells.peek()
    const cell = cells.findIndex((c) => c.id === id)
    if (cell !== -1) {
      store$.cells[cell].content.set(content)
      store$.cells[cell].error.set(null)
    }
  },

  updateCellOutput: (id, output, executionCount) => {
    const cells = store$.cells.peek()
    const cell = cells.findIndex((c) => c.id === id)
    if (cell !== -1) {
      store$.cells[cell].output.set(JSON.parse(output))
      store$.cells[cell].executionCount.set(executionCount)
      store$.cells[cell].error.set(null)
    }
  },

  setCellError: (id, error) => {
    const cells = store$.cells.peek()
    const cell = cells.findIndex((c) => c.id === id)
    if (cell !== -1) {
      store$.cells[cell].error.set(error)
    }
  },

  selectCell: (id) => {
    store$.selectedCellId.set(id)
  },

  moveCellUp: (id) => {
    const cells = store$.cells.peek()
    const index = cells.findIndex((c) => c.id === id)
    if (index > 0) {
      const [moved] = store$.cells.splice(index, 1)
      store$.cells.splice(index - 1, 0, moved)
    }
  },

  moveCellDown: (id) => {
    const cells = store$.cells.peek()
    const index = cells.findIndex((c) => c.id === id)
    if (index < cells.length - 1) {
      const [moved] = store$.cells.splice(index, 1)
      store$.cells.splice(index + 1, 0, moved)
    }
  },

  updateCell: (id, cell) => {
    const index = store$.cells.peek().findIndex((c) => c.id === id)
    if (index !== -1) {
      store$.cells[index].set({ ...store$.cells[index].peek(), ...cell })
    }
  },

  updateGlobalObject: (globalObject: Record<string, any>) => {
    for (const [key, value] of Object.entries(globalObject)) {
      store$.globalObject[key].set(value)
    }
  },

  setGlobalObject: (globalObject: Record<string, any>) => {
    store$.globalObject.set(globalObject)
  },
})
// )
