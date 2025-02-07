import { batch, observable } from "@legendapp/state"
import { ObservablePersistLocalStorage } from "@legendapp/state/persist-plugins/local-storage"
import { syncObservable } from "@legendapp/state/sync"
import { createId } from "@paralleldrive/cuid2"

interface BaseCell<T> {
  id: string
  type: T
  error: string | null
  dependencies: string[]
}

type FunctionArg = {
  name: string
  type: string
}

export interface FunctionCell extends BaseCell<"function"> {
  __raw: string

  name: string
  args: FunctionArg[]
  body: string
  returnType: string
}

function FunctionCell(): FunctionCell {
  return {
    id: createId(),
    type: "function",
    error: null,
    dependencies: [],
    __raw: "",
    name: "",
    args: [],
    body: "",
    returnType: "",
  }
}

export function addFunctionCell() {
  notebook$.cells.push(FunctionCell())
}

export interface VariableDeclarationCell extends BaseCell<"variable"> {
  __raw: string

  name: string
  body: string
  // TODO: fix this
  dataType: string
  value: any
}

function VariableDeclarationCell(): VariableDeclarationCell {
  return {
    id: createId(),
    type: "variable",
    error: null,
    dependencies: [],
    __raw: "",
    name: "",
    body: "",
    dataType: "",
    value: null,
  }
}

export function addVariableDeclarationCell() {
  notebook$.cells.push(VariableDeclarationCell())
}

export interface ReactiveCell extends BaseCell<"reactive"> {
  __raw: string

  name: string
  body: string
  returnType: string
  cachedValue: any
}

function ReactiveCell(): ReactiveCell {
  return {
    id: createId(),
    type: "reactive",
    error: null,
    dependencies: [],
    __raw: "",
    name: "",
    body: "",
    returnType: "",
    cachedValue: null,
  }
}

export function addReactiveCell() {
  notebook$.cells.push(ReactiveCell())
}

export type Cell = FunctionCell | VariableDeclarationCell | ReactiveCell

interface NotebookState {
  cells: Cell[]
  globalObject: Record<string, any>
  focusedCellId: string | null
}

export const notebook$ = observable<NotebookState>({
  cells: [],
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
  batch(() => {
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

    if (index === -1) {
      notebook$.cells.push(newCell)
    } else {
      notebook$.cells.splice(index + 1, 0, newCell)
    }

    // Set focus after a short delay to ensure the component is mounted
    setTimeout(() => {
      notebook$.focusedCellId.set(newCell.id)
    }, 0)
  })
}

export function deleteCell(id: string) {
  const cells = notebook$.cells.peek()
  const index = cells.findIndex((c) => c.id === id)
  if (index !== -1) {
    notebook$.cells.splice(index, 1)
  }
  if (notebook$.focusedCellId.peek() === id) {
    notebook$.focusedCellId.set(null)
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
  notebook$.focusedCellId.set(id)
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
