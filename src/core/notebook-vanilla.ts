import { EditorView } from "@codemirror/view";
import { langs } from "@uiw/codemirror-extensions-langs";
import { JavaScriptExecutor } from "../runtime/js-executor";
import { githubDark } from "@uiw/codemirror-themes-all";
import { transform } from "../runtime/find-references";
import {
  observable,
  ObservableObject,
  computed,
  Observable,
} from "@legendapp/state";

export interface Cell {
  id: string;
  type: "code";
  content: string;
  output?: {
    result: any;
    logs: string[];
  };
  error?: string;
  analysis?: {
    exports: Array<{ name: string; value: any; type: string }>;
    references: Array<{ name: string; count: number }>;
  };
}

export interface NotebookOptions {
  state$?: Observable<NotebookState>;
}

export interface NotebookState {
  cells: Cell[];
  focusedCellId: string | null;
  globals: Record<string, any>;
}

export class Notebook {
  private state$: Observable<NotebookState>;
  private options: NotebookOptions;
  private cellElements = new Map<string, HTMLElement>();
  private containerElement: HTMLElement | null = null;
  private unsubscribers: Array<() => void> = [];

  constructor(options: NotebookOptions = {}) {
    this.options = options;

    // Use provided state observable or create a new one
    this.state$ =
      options.state$ ||
      observable<NotebookState>({
        cells: [],
        focusedCellId: null,
        globals: {},
      });
  }

  // Cell Management
  addCell(aboveId?: string) {
    const newCell: Cell = {
      id: crypto.randomUUID(),
      type: "code",
      content: "",
    };

    if (aboveId) {
      const index = this.state$.cells
        .get()
        .findIndex((cell) => cell.id === aboveId);
      this.state$.cells.splice(index + 1, 0, newCell);
    } else {
      this.state$.cells.push(newCell);
    }

    this.focusCell(newCell.id);
    return newCell.id;
  }

  updateCell(id: string, content: string) {
    const index = this.state$.cells.get().findIndex((cell) => cell.id === id);
    if (index !== -1) {
      this.state$.cells[index].content.set(content);
    }
  }

  deleteCell(id: string) {
    const index = this.state$.cells.get().findIndex((cell) => cell.id === id);
    if (index !== -1) {
      this.state$.cells.splice(index, 1);
    }
  }

  focusCell(id: string | null) {
    if (id === null || this.state$.cells.get().some((cell) => cell.id === id)) {
      this.state$.focusedCellId.set(id);
    }
  }

  // Cell Execution
  async executeCell(id: string) {
    const cell = this.state$.cells.get().find((c) => c.id === id);
    if (!cell) return;

    try {
      const logs: string[] = [];
      const executor = new JavaScriptExecutor({
        onLog: (log) => {
          console.log(log);
          logs.push(log);
        },
      });

      // Transform code to track references
      const { code: transformedCode, references } =
        (await transform(
          cell.content,
          new Set(Object.keys(this.state$.globals.get())),
          "",
        )) || [];

      // Execute the transformed code
      const result = await executor.execute(
        transformedCode,
        Object.entries(this.state$.globals.get()).map(([name, value]) => ({
          name,
          value,
        })),
      );

      // Extract exports from result
      const exports =
        result.result && typeof result.result === "object"
          ? Object.entries(result.result).map(([name, value]) => ({
              name,
              value,
              type: typeof value,
            }))
          : [];

      // Update cell with result and analysis
      const index = this.state$.cells.get().findIndex((c) => c.id === id);
      if (index !== -1) {
        this.state$.cells[index].set({
          ...cell,
          output: {
            result: result.result,
            logs: [...logs, ...result.logs],
          },
          error: undefined,
          analysis: {
            exports,
            references:
              references?.map((r) => ({
                name: r.name,
                count: r.dependencies,
              })) || [],
          },
        });
      }

      // Update globals with exports
      if (exports.length > 0) {
        const newGlobals = { ...this.state$.globals.get() };
        exports.forEach(({ name, value }) => {
          newGlobals[name] = value;
        });
        this.state$.globals.set(newGlobals);
      }
    } catch (err) {
      // Update cell with error
      const error = err as Error;
      const index = this.state$.cells.get().findIndex((c) => c.id === id);
      if (index !== -1) {
        this.state$.cells[index].set({
          ...cell,
          error: error.message,
          output: { result: null, logs: [] },
          analysis: { exports: [], references: [] },
        });
      }
    }
  }

  // DOM Integration
  mount(element: HTMLElement) {
    // Add CSS variables for theming
    const style = document.createElement("style");
    style.textContent = `
      :root {
        --background: #000000;
        --foreground: #ffffff;
        --muted-foreground: #888888;
        --border: #333333;
        --primary: #0ea5e9;
        --primary-foreground: #ffffff;
        --accent: rgba(255, 255, 255, 0.1);
      }
    `;
    document.head.appendChild(style);

    // Create notebook container
    const container = document.createElement("div");
    container.className =
      "flex flex-col w-full h-full bg-background text-foreground";
    container.setAttribute("role", "list");
    container.setAttribute("aria-label", "Notebook cells");

    // Create toolbar
    const toolbar = document.createElement("div");
    toolbar.className = "flex items-center p-4 border-b border-border";

    const addCellButton = document.createElement("button");
    addCellButton.className =
      "px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md text-sm font-medium";
    addCellButton.textContent = "Add Cell";
    addCellButton.onclick = () => this.addCell();

    toolbar.appendChild(addCellButton);
    container.appendChild(toolbar);

    // Create cells container
    const cellsContainer = document.createElement("div");
    cellsContainer.className = "flex-1 overflow-auto";
    container.appendChild(cellsContainer);

    element.appendChild(container);

    // Store cells container reference
    this.containerElement = cellsContainer;

    // Subscribe to state changes for rendering
    const unsubRender = this.state$.onChange(() => {
      this.render(cellsContainer);
    });
    this.unsubscribers.push(unsubRender);

    // Setup keyboard shortcuts
    this.setupKeyboardShortcuts(container);

    // Add initial cell if empty
    if (this.state$.cells.get().length === 0) {
      this.addCell();
    }

    return () => {
      element.removeChild(container);
      this.containerElement = null;
      this.cleanup();
    };
  }

  private render(container: HTMLElement) {
    // Clear existing content and cell elements map
    container.innerHTML = "";
    this.cellElements.clear();

    // Render all cells
    this.state$.cells.get().forEach((cell) => {
      const cellElement = this.createCellElement(cell);
      this.cellElements.set(cell.id, cellElement);
      container.appendChild(cellElement);
    });

    // Focus the focused cell if any
    const focusedId = this.state$.focusedCellId.get();
    if (focusedId) {
      const focusedElement = this.cellElements.get(focusedId);
      if (focusedElement) {
        const editor = focusedElement.querySelector(".cell-editor");
        if (editor) {
          (editor as HTMLElement).focus();
        }
      }
    }
  }

  private createCellElement(cell: Cell): HTMLElement {
    // Create cell container
    const cellElement = document.createElement("div");
    cellElement.className = "flex px-4 pt-4 gap-2";
    cellElement.setAttribute("data-cell-id", cell.id);
    cellElement.setAttribute("role", "region");
    cellElement.setAttribute("aria-label", `Code cell ${cell.id}`);

    // Create editor container
    const editorContainer = document.createElement("div");
    editorContainer.className =
      "border border-border rounded-md overflow-hidden flex-1";
    editorContainer.setAttribute("role", "textbox");
    editorContainer.setAttribute("aria-label", "Code editor");

    // Create editor wrapper for button positioning
    const editorWrapper = document.createElement("div");
    editorWrapper.className = "relative";

    // Create execution button
    const executeButton = document.createElement("button");
    executeButton.className =
      "absolute right-2 top-2 p-1 rounded hover:bg-accent/50 text-muted-foreground hover:text-foreground transition-colors z-50";
    executeButton.title = "Run cell (Shift+Enter)";
    executeButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4">
        <polygon points="5 3 19 12 5 21 5 3"></polygon>
      </svg>
    `;
    executeButton.onclick = () => this.executeCell(cell.id);

    // Create editor element
    const editorElement = document.createElement("div");
    editorElement.className = "cell-editor";

    // Create CodeMirror instance with improved configuration
    const view = new EditorView({
      doc: cell.content,
      extensions: [
        langs.typescript(),
        githubDark,
        EditorView.editable.of(true),
        EditorView.theme({
          "&": {
            fontSize: "14px",
            backgroundColor: "transparent",
            height: "auto",
            minHeight: "4rem",
          },
          ".cm-content": {
            fontFamily:
              "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
            padding: "1rem",
            minHeight: "4rem",
          },
          ".cm-line": {
            padding: "0 0.5rem",
          },
          ".cm-focused": {
            outline: "none",
          },
          "&.cm-editor": {
            backgroundColor: "transparent",
          },
          ".cm-gutters": {
            backgroundColor: "transparent",
            borderRight: "1px solid var(--border)",
            color: "var(--muted-foreground)",
          },
          ".cm-activeLineGutter": {
            backgroundColor: "transparent",
          },
        }),
        EditorView.lineWrapping,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            this.updateCell(cell.id, update.state.doc.toString());
          }
        }),
      ],
      parent: editorElement,
    });

    // Assemble the elements
    editorWrapper.appendChild(executeButton);
    editorWrapper.appendChild(editorElement);
    editorContainer.appendChild(editorWrapper);

    // Create output container if there's output
    if (cell.output) {
      const outputContainer = document.createElement("div");
      outputContainer.className = "border-t border-border";

      // Show logs if any
      if (cell.output.logs.length > 0) {
        const logsContainer = document.createElement("div");
        logsContainer.className =
          "p-2 font-mono text-sm text-foreground border-b border-border";
        cell.output.logs.forEach((log) => {
          const logLine = document.createElement("div");
          logLine.className = "text-muted-foreground";
          logLine.textContent = log;
          logsContainer.appendChild(logLine);
        });
        outputContainer.appendChild(logsContainer);
      }

      // Show result if any
      if (cell.output.result !== undefined) {
        const resultContainer = document.createElement("div");
        resultContainer.className = "p-2 font-mono text-sm text-foreground";

        if (typeof cell.output.result === "object") {
          resultContainer.textContent = JSON.stringify(
            cell.output.result,
            null,
            2,
          );
        } else {
          resultContainer.textContent = String(cell.output.result);
        }

        outputContainer.appendChild(resultContainer);
      }

      editorContainer.appendChild(outputContainer);
    }

    // Create error container if there's an error
    if (cell.error) {
      const errorContainer = document.createElement("div");
      errorContainer.className =
        "flex-1 p-2 font-mono text-sm bg-red-50 text-red-900 border-t border-red-200";
      errorContainer.setAttribute("role", "alert");
      errorContainer.textContent = cell.error;
      editorContainer.appendChild(errorContainer);
    }

    cellElement.appendChild(editorContainer);
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
    this.unsubscribers.forEach((unsub) => unsub());
    this.unsubscribers = [];
    this.cellElements.clear();
  }

  // Public API
  getState(): NotebookState {
    return {
      cells: this.state$.cells.get(),
      focusedCellId: this.state$.focusedCellId.get(),
      globals: this.state$.globals.get(),
    };
  }

  getStateObservable(): Observable<NotebookState> {
    return this.state$;
  }
}
