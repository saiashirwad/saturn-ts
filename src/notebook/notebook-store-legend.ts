import { observable } from "@legendapp/state"
import { ObservablePersistLocalStorage } from "@legendapp/state/persist-plugins/local-storage"
import { syncObservable } from "@legendapp/state/sync"
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
}

export const notebook$ = observable<NotebookState>({
  cells: [],
  selectedCellId: null,
  globalObject: {},
  focusedCellId: null,
})

syncObservable(notebook$, {
  persist: {
    name: "notebook",
    plugin: ObservablePersistLocalStorage,
  },
})

export function setFocusedCell(id: string | null) {
  notebook$.focusedCellId.set(id)
}

export function addCell(type: "code" | "markdown", belowId?: string) {
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
}

export function deleteCell(id: string) {
  const cells = notebook$.cells.peek()
  const index = cells.findIndex((c) => c.id === id)
  if (index !== -1) {
    notebook$.cells.splice(index, 1)
  }
  if (notebook$.selectedCellId.peek() === id) {
    notebook$.selectedCellId.set(null)
  }
}

export function updateCellContent(id: string, content: string) {
  const cells = notebook$.cells.peek()
  const cell = cells.findIndex((c) => c.id === id)
  if (cell !== -1) {
    notebook$.cells[cell].content.set(content)
    notebook$.cells[cell].error.set(null)
  }
}

export function updateCellOutput(
  id: string,
  output: string,
  executionCount: number,
) {
  const cells = notebook$.cells.peek()
  const cell = cells.findIndex((c) => c.id === id)
  if (cell !== -1) {
    notebook$.cells[cell].output.set(JSON.parse(output))
    notebook$.cells[cell].executionCount.set(executionCount)
    notebook$.cells[cell].error.set(null)
  }
}

export function setCellError(id: string, error: string) {
  const cells = notebook$.cells.peek()
  const cell = cells.findIndex((c) => c.id === id)
  if (cell !== -1) {
    notebook$.cells[cell].error.set(error)
  }
}

export function selectCell(id: string) {
  notebook$.selectedCellId.set(id)
}

export function moveCellUp(id: string) {
  const cells = notebook$.cells.peek()
  const index = cells.findIndex((c) => c.id === id)
  if (index > 0) {
    const [moved] = notebook$.cells.splice(index, 1)
    notebook$.cells.splice(index - 1, 0, moved)
  }
}

export function moveCellDown(id: string) {
  const cells = notebook$.cells.peek()
  const index = cells.findIndex((c) => c.id === id)
  if (index < cells.length - 1) {
    const [moved] = notebook$.cells.splice(index, 1)
    notebook$.cells.splice(index + 1, 0, moved)
  }
}

export function updateCell(id: string, cell: Partial<Cell>) {
  const index = notebook$.cells.peek().findIndex((c) => c.id === id)
  if (index !== -1) {
    notebook$.cells[index].set({ ...notebook$.cells[index].peek(), ...cell })
  }
}

export function updateGlobalObject(globalObject: Record<string, any>) {
  for (const [key, value] of Object.entries(globalObject)) {
    notebook$.globalObject[key].set(value)
  }
}

export function setGlobalObject(globalObject: Record<string, any>) {
  notebook$.globalObject.set(globalObject)
}
