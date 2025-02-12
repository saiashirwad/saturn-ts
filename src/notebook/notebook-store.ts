import { batch, observable } from "@legendapp/state";
import { ObservablePersistLocalStorage } from "@legendapp/state/persist-plugins/local-storage";
import { syncObservable } from "@legendapp/state/sync";
import { createId } from "@paralleldrive/cuid2";
import { hashCode } from "../utils/hash";

interface CodeCellOutput {
  logs: string[];
  result: unknown;
}

interface TextCellOutput {
  html: string;
}

interface BaseCell {
  id: string;
  type: "text" | "code";
  content: string;
  error: string | null;
  hash?: string;
  analysis: {
    exports: Array<{
      name: string;
      type: string;
      value: any;
    }>;
    references: string[]; // All external values this cell references
  };
  showLogs: boolean;
  showOutput: boolean;
}

export interface TextCell extends BaseCell {
  type: "text";
  output: TextCellOutput | null;
}

export interface CodeCell extends BaseCell {
  type: "code";
  output: CodeCellOutput | null;
}

export type Cell = TextCell | CodeCell;

function createCell(type: Cell["type"] = "code"): Cell {
  return {
    id: createId(),
    type,
    content: "",
    error: null,
    output: null,
    analysis: {
      exports: [],
      references: [],
    },
    showLogs: true,
    showOutput: true,
  };
}

interface NotebookState {
  cells: Cell[];
  focusedCellId: string | null;
  globals: Array<{
    name: string;
    value: any;
    type: string;
    sourceCell: string;
  }>;
}

export const notebook$ = observable<NotebookState>({
  cells: [],
  focusedCellId: null,
  globals: () => {
    const cells = notebook$.cells.get();
    return cells.flatMap(
      (cell) =>
        cell.analysis?.exports?.map((exp) => ({
          name: exp.name,
          value: exp.value,
          type: exp.type,
          sourceCell: cell.id,
        })) ?? [],
    );
  },
});

syncObservable(notebook$, {
  persist: {
    name: "notebook",
    plugin: ObservablePersistLocalStorage,
  },
});

export function setFocusedCell(id: string | null) {
  notebook$.focusedCellId.set(id);
}

export function addCell(belowId?: string) {
  const cell = createCell();
  batch(() => {
    const cells = notebook$.cells.peek();
    const index = belowId ? cells.findIndex((c) => c.id === belowId) : -1;

    if (index === -1) {
      notebook$.cells.push(cell);
    } else {
      notebook$.cells.splice(index + 1, 0, cell);
    }

    setTimeout(() => {
      notebook$.focusedCellId.set(cell.id);
    }, 0);
  });
}

export function deleteCell(id: string) {
  const cells = notebook$.cells.peek();
  const index = cells.findIndex((c) => c.id === id);
  if (index !== -1) {
    notebook$.cells.splice(index, 1);
  }
  if (notebook$.focusedCellId.peek() === id) {
    notebook$.focusedCellId.set(null);
  }
}

export function updateCellContent(id: string, content: string) {
  const cells = notebook$.cells.peek();
  const cell = cells.findIndex((c) => c.id === id);
  if (cell !== -1) {
    notebook$.cells[cell].content.set(content);
    notebook$.cells[cell].error.set(null);
  }
}

export function updateCellOutput(
  id: string,
  output: CodeCellOutput | TextCellOutput,
) {
  const cells = notebook$.cells.peek();
  const cell = cells.findIndex((c) => c.id === id);
  if (cell !== -1) {
    // TODO: fix this
    // @ts-ignore
    notebook$.cells[cell].output.set(output);
    notebook$.cells[cell].error.set(null);
  }
}

export function setCellError(id: string, error: string) {
  const cells = notebook$.cells.peek();
  const cell = cells.findIndex((c) => c.id === id);
  if (cell !== -1) {
    notebook$.cells[cell].error.set(error);
  }
}

export function selectCell(id: string) {
  notebook$.focusedCellId.set(id);
}

export function moveCellUp(id: string) {
  const cells = notebook$.cells.peek();
  const index = cells.findIndex((c) => c.id === id);
  if (index > 0) {
    const [moved] = notebook$.cells.splice(index, 1);
    notebook$.cells.splice(index - 1, 0, moved);
  }
}

export function moveCellDown(id: string) {
  const cells = notebook$.cells.peek();
  const index = cells.findIndex((c) => c.id === id);
  if (index < cells.length - 1) {
    const [moved] = notebook$.cells.splice(index, 1);
    notebook$.cells.splice(index + 1, 0, moved);
  }
}

export function updateCell(id: string, updates: Partial<Cell>) {
  const index = notebook$.cells.peek().findIndex((c) => c.id === id);
  if (index !== -1) {
    const currentCell = notebook$.cells[index].peek();

    if (
      updates.content !== undefined &&
      updates.content !== currentCell.content
    ) {
      updates.hash = hashCode(updates.content);
    }

    if (updates.output) {
      if (currentCell.type === "code" && !isCodeCellOutput(updates.output)) {
        throw new Error("Invalid output type for code cell");
      }
      if (currentCell.type === "text" && !isTextCellOutput(updates.output)) {
        throw new Error("Invalid output type for text cell");
      }
    }

    // TODO: fix this
    // @ts-ignore
    notebook$.cells[index].set({
      ...currentCell,
      ...updates,
    });
  }
}

export function updateCellAnalysis(id: string, analysis: BaseCell["analysis"]) {
  const index = notebook$.cells.peek().findIndex((c) => c.id === id);
  if (index !== -1) {
    if (!notebook$.cells[index].analysis.peek()) {
      notebook$.cells[index].analysis.set({
        exports: [],
        references: [],
      });
    }
    notebook$.cells[index].analysis.set(analysis);
  }
}

export function toggleCellLogs(id: string) {
  const index = notebook$.cells.peek().findIndex((c) => c.id === id);
  if (index !== -1) {
    const current = notebook$.cells[index].showLogs.peek();
    notebook$.cells[index].showLogs.set(!current);
  }
}

export function toggleCellOutput(id: string) {
  const index = notebook$.cells.peek().findIndex((c) => c.id === id);
  if (index !== -1) {
    const current = notebook$.cells[index].showOutput.peek();
    notebook$.cells[index].showOutput.set(!current);
  }
}

function isCodeCellOutput(output: any): output is CodeCellOutput {
  return output && Array.isArray(output.logs) && "result" in output;
}

function isTextCellOutput(output: any): output is TextCellOutput {
  return output && typeof output.html === "string";
}
