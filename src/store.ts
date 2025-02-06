import { createId } from "@paralleldrive/cuid2"
import { temporal } from "zundo"
import { create } from "zustand"
import { immer } from "zustand/middleware/immer"

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

export const useNotebookStore = create<NotebookStore>()(
  immer(
    temporal(
      (set) => ({
        cells: [],
        selectedCellId: null,
        globalObject: {},
        addCell: (type, belowId) =>
          set((state) => {
            const newCell: Cell = {
              id: createId(),
              type,
              content: "",
              output: {},
              executionCount: null,
              error: null,
            }

            const index = belowId
              ? state.cells.findIndex((c) => c.id === belowId)
              : -1

            if (index !== -1) {
              state.cells.splice(index + 1, 0, newCell)
            } else {
              state.cells.push(newCell)
            }
            state.selectedCellId = newCell.id
          }),

        deleteCell: (id) =>
          set((state) => {
            state.cells = state.cells.filter((cell) => cell.id !== id)
            if (state.selectedCellId === id) {
              state.selectedCellId = null
            }
          }),

        updateCellContent: (id, content) =>
          set((state) => {
            const cell = state.cells.find((c) => c.id === id)
            if (cell) {
              cell.content = content
              cell.error = null
            }
          }),

        updateCellOutput: (id, output, executionCount) =>
          set((state) => {
            const cell = state.cells.find((c) => c.id === id)
            if (cell) {
              cell.output = JSON.parse(output)
              cell.executionCount = executionCount
              cell.error = null
            }
          }),

        setCellError: (id, error) =>
          set((state) => {
            const cell = state.cells.find((c) => c.id === id)
            if (cell) {
              cell.error = error
            }
          }),

        selectCell: (id) =>
          set((state) => {
            state.selectedCellId = id
          }),

        moveCellUp: (id) =>
          set((state) => {
            const index = state.cells.findIndex((c) => c.id === id)
            if (index > 0) {
              const [moved] = state.cells.splice(index, 1)
              state.cells.splice(index - 1, 0, moved)
            }
          }),

        moveCellDown: (id) =>
          set((state) => {
            const index = state.cells.findIndex((c) => c.id === id)
            if (index < state.cells.length - 1) {
              const [moved] = state.cells.splice(index, 1)
              state.cells.splice(index + 1, 0, moved)
            }
          }),

        updateCell: (id, cell) =>
          set((state) => {
            const index = state.cells.findIndex((c) => c.id === id)
            if (index !== -1) {
              state.cells[index] = { ...state.cells[index], ...cell }
            }
          }),

        updateGlobalObject: (globalObject) =>
          set((state) => {
            for (const [key, value] of Object.entries(globalObject)) {
              state.globalObject[key] = value
            }
          }),

        setGlobalObject: (globalObject) =>
          set((state) => {
            state.globalObject = globalObject
          }),
      }),
      {},
    ),
  ),
)
