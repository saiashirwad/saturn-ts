import { EditorView } from "@codemirror/view";
import { langs } from "@uiw/codemirror-extensions-langs";
import { JavaScriptExecutor } from "../runtime/js-executor";

export interface Cell {
  id: string;
  type: "code";
  content: string;
  output?: any;
  error?: string;
}

export interface NotebookOptions {
  onStateChange?: (state: NotebookState) => void;
  onCellExecuted?: (cellId: string, output: any) => void;
}

export interface NotebookState {
  cells: Cell[];
  focusedCellId: string | null;
  globals: Record<string, any>;
}

export class Notebook {
  private state: NotebookState = {
    cells: [],
    focusedCellId: null,
    globals: {},
  };

  private options: NotebookOptions;
  private observers = new Set<(state: NotebookState) => void>();
  private cellElements = new Map<string, HTMLElement>();

  constructor(options: NotebookOptions = {}) {
    this.options = options;

    if (options.onStateChange) {
      this.observers.add(options.onStateChange);
    }
  }

  // State Management
  private setState(update: Partial<NotebookState>) {
    this.state = { ...this.state, ...update };
    this.notifyObservers();
  }

  private notifyObservers() {
    this.observers.forEach((observer) => observer(this.state));
  }

  // Cell Management
  addCell(aboveId?: string) {
    const newCell: Cell = {
      id: crypto.randomUUID(),
      type: "code",
      content: "",
    };

    const cells = [...this.state.cells];
    if (aboveId) {
      const index = cells.findIndex((cell) => cell.id === aboveId);
      cells.splice(index + 1, 0, newCell);
    } else {
      cells.push(newCell);
    }

    this.setState({ cells });
    this.focusCell(newCell.id);
    return newCell.id;
  }

  updateCell(id: string, content: string) {
    const cells = this.state.cells.map((cell) =>
      cell.id === id ? { ...cell, content } : cell,
    );
    this.setState({ cells });
  }

  deleteCell(id: string) {
    const cells = this.state.cells.filter((cell) => cell.id !== id);
    this.setState({ cells });
  }

  focusCell(id: string | null) {
    this.setState({ focusedCellId: id });
  }

  // Cell Execution
  async executeCell(id: string) {
    const cell = this.state.cells.find((c) => c.id === id);
    if (!cell) return;

    try {
      const executor = new JavaScriptExecutor({
        onLog: (log) => console.log(log),
      });
      const result = await executor.execute(cell.content, []);

      // Update cell with result
      const cells = this.state.cells.map((c) =>
        c.id === id ? { ...c, output: result.result, error: undefined } : c,
      );

      this.setState({ cells });
      this.options.onCellExecuted?.(id, result.result);
    } catch (err) {
      // Update cell with error
      const error = err as Error;
      const cells = this.state.cells.map((c) =>
        c.id === id ? { ...c, error: error.message } : c,
      );
      this.setState({ cells });
    }
  }

  // DOM Integration
  mount(element: HTMLElement) {
    // Create notebook container
    const container = document.createElement("div");
    container.className = "notebook-container";
    element.appendChild(container);

    // Initial render
    this.render(container);

    // Setup keyboard shortcuts
    this.setupKeyboardShortcuts(container);

    return () => {
      element.removeChild(container);
      this.cleanup();
    };
  }

  private render(container: HTMLElement) {
    container.innerHTML = "";

    this.state.cells.forEach((cell) => {
      const cellElement = this.createCellElement(cell);
      this.cellElements.set(cell.id, cellElement);
      container.appendChild(cellElement);
    });
  }

  private createCellElement(cell: Cell): HTMLElement {
    const cellElement = document.createElement("div");
    cellElement.className = "notebook-cell";
    cellElement.setAttribute("data-cell-id", cell.id);

    // Create cell UI components
    const editorElement = document.createElement("div");
    editorElement.className = "cell-editor";
    cellElement.appendChild(editorElement);

    // Create CodeMirror instance
    const view = new EditorView({
      doc: cell.content,
      extensions: [
        langs.typescript(),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            this.updateCell(cell.id, update.state.doc.toString());
          }
        }),
      ],
      parent: editorElement,
    });

    // Add execution button
    const executeButton = document.createElement("button");
    executeButton.textContent = "▶";
    executeButton.onclick = () => this.executeCell(cell.id);
    cellElement.appendChild(executeButton);

    return cellElement;
  }

  private setupKeyboardShortcuts(container: HTMLElement) {
    container.addEventListener("keydown", (e) => {
      // Shift + Enter to execute
      if (e.key === "Enter" && e.shiftKey) {
        const cellElement = (e.target as HTMLElement).closest("[data-cell-id]");
        const cellId = cellElement?.getAttribute("data-cell-id");
        if (cellId) {
          this.executeCell(cellId);
          e.preventDefault();
        }
      }
    });
  }

  private cleanup() {
    this.observers.clear();
    this.cellElements.clear();
  }

  // Public API
  getState(): NotebookState {
    return { ...this.state };
  }

  subscribe(observer: (state: NotebookState) => void) {
    this.observers.add(observer);
    return () => this.observers.delete(observer);
  }
}
