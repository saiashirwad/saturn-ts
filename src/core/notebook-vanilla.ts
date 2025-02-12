import { EditorView } from "@codemirror/view";
import { Observable, observable } from "@legendapp/state";
import { langs } from "@uiw/codemirror-extensions-langs";
import { githubDark } from "@uiw/codemirror-themes-all";
import { transform } from "../runtime/find-references";
import { JavaScriptExecutor } from "../runtime/js-executor";

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

  // Performance optimizations
  private batchedUpdates = new Set<string>();
  private updateRAF: number | null = null;
  private cellTemplate: HTMLElement | null = null;
  private elementPool: HTMLElement[] = [];
  private editorInstances = new Map<string, EditorView>();

  constructor(options: NotebookOptions = {}) {
    this.options = options;

    this.state$ =
      options.state$ ||
      observable<NotebookState>({
        cells: [],
        focusedCellId: null,
        globals: {},
      });
  }

  // Batched Updates
  private queueUpdate(cellId: string) {
    this.batchedUpdates.add(cellId);

    if (!this.updateRAF) {
      this.updateRAF = requestAnimationFrame(() => {
        this.processBatchedUpdates();
      });
    }
  }

  private processBatchedUpdates() {
    for (const cellId of this.batchedUpdates) {
      const cell = this.state$.cells.get().find((c) => c.id === cellId);
      const element = this.cellElements.get(cellId);
      if (cell && element) {
        this.updateCellOutput(element, cell);
      }
    }
    this.batchedUpdates.clear();
    this.updateRAF = null;
  }

  // Element Pooling
  private getCellElement(): HTMLElement {
    return this.elementPool.pop() || this.createCellTemplate();
  }

  private recycleCellElement(element: HTMLElement) {
    // Clean up the element
    element.innerHTML = "";
    element.className = "flex px-4 pt-4 gap-2";
    this.elementPool.push(element);
  }

  private createCellTemplate(): HTMLElement {
    const cellElement = document.createElement("div");
    cellElement.className = "cell";
    cellElement.setAttribute("role", "region");

    const editorContainer = document.createElement("div");
    editorContainer.className = "cell-container";
    editorContainer.setAttribute("role", "textbox");
    editorContainer.setAttribute("aria-label", "Code editor");

    const editorWrapper = document.createElement("div");
    editorWrapper.className = "cell-editor-wrapper";

    const executeButton = document.createElement("button");
    executeButton.className = "execute-button";
    executeButton.title = "Run cell (Shift+Enter)";
    executeButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4">
        <polygon points="5 3 19 12 5 21 5 3"></polygon>
      </svg>
    `;

    const editorElement = document.createElement("div");
    editorElement.className = "cell-editor";

    editorWrapper.appendChild(executeButton);
    editorWrapper.appendChild(editorElement);
    editorContainer.appendChild(editorWrapper);
    cellElement.appendChild(editorContainer);

    return cellElement;
  }

  private createCellElement(cell: Cell): HTMLElement {
    // Get a cell element from the pool or create new template
    const cellElement = this.getCellElement();

    // Set cell-specific attributes
    cellElement.setAttribute("data-cell-id", cell.id);
    cellElement.setAttribute("aria-label", `Code cell ${cell.id}`);

    // Get the editor element
    const editorElement = cellElement.querySelector(
      ".cell-editor",
    ) as HTMLElement;
    const executeButton = cellElement.querySelector("button") as HTMLElement;

    // Setup execute button
    executeButton.onclick = () => this.executeCell(cell.id);

    // Create and store CodeMirror instance
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
          ".cm-line": { padding: "0 0.5rem" },
          ".cm-focused": { outline: "none" },
          "&.cm-editor": { backgroundColor: "transparent" },
          ".cm-gutters": {
            backgroundColor: "transparent",
            borderRight: "1px solid var(--border)",
            color: "var(--muted-foreground)",
          },
          ".cm-activeLineGutter": { backgroundColor: "transparent" },
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

    this.editorInstances.set(cell.id, view);

    // Update output if exists
    if (cell.output || cell.error) {
      this.updateCellOutput(cellElement, cell);
    }

    return cellElement;
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
        /* Base colors */
        --background: #0c0c0e;
        --foreground: #e2e2e2;
        --muted: #71717a;
        
        /* UI elements */
        --border: #27272a;
        --surface: #18181b;
        --surface-hover: #27272a;
        
        /* Accent colors */
        --primary: #3b82f6;
        --primary-hover: #2563eb;
        --primary-foreground: #ffffff;
        
        /* Editor colors */
        --editor-bg: var(--surface);
        --editor-border: var(--border);
        --editor-gutter: var(--surface);
        --editor-line-number: var(--muted);
        
        /* Output colors */
        --output-bg: var(--surface);
        --output-border: var(--border);
        --output-text: var(--foreground);
        --output-muted: var(--muted);
        
        /* Error colors */
        --error-bg: #450a0a;
        --error-border: #dc2626;
        --error-text: #fca5a5;
      }

      .notebook {
        background: var(--background);
        color: var(--foreground);
        min-height: 100vh;
      }

      .notebook-toolbar {
        background: var(--surface);
        border-bottom: 1px solid var(--border);
        padding: 0.75rem 1rem;
      }

      .add-cell-button {
        background: var(--primary);
        color: var(--primary-foreground);
        padding: 0.5rem 1rem;
        border-radius: 0.375rem;
        font-size: 0.875rem;
        font-weight: 500;
        transition: all 150ms ease;
      }

      .add-cell-button:hover {
        background: var(--primary-hover);
      }

      .cell {
        padding: 1rem;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .cell:hover {
        background: var(--surface);
      }

      .cell-container {
        border: 1px solid var(--border);
        border-radius: 0.5rem;
        overflow: hidden;
        background: var(--editor-bg);
      }

      .cell-editor-wrapper {
        position: relative;
      }

      .execute-button {
        position: absolute;
        right: 0.75rem;
        top: 0.75rem;
        padding: 0.375rem;
        border-radius: 0.375rem;
        color: var(--muted);
        background: var(--surface);
        transition: all 150ms ease;
        z-index: 10;
      }

      .execute-button:hover {
        background: var(--surface-hover);
        color: var(--foreground);
      }

      .output-container {
        border-top: 1px solid var(--border);
        background: var(--output-bg);
      }

      .output-logs {
        padding: 0.75rem 1rem;
        font-family: ui-monospace, monospace;
        font-size: 0.875rem;
        color: var(--output-text);
        border-bottom: 1px solid var(--border);
      }

      .output-log-line {
        color: var(--output-muted);
        padding: 0.125rem 0;
      }

      .output-result {
        padding: 0.75rem 1rem;
        font-family: ui-monospace, monospace;
        font-size: 0.875rem;
        color: var(--output-text);
        white-space: pre-wrap;
      }

      .error-container {
        padding: 0.75rem 1rem;
        background: var(--error-bg);
        border-top: 1px solid var(--error-border);
        color: var(--error-text);
        font-family: ui-monospace, monospace;
        font-size: 0.875rem;
      }
    `;
    document.head.appendChild(style);

    // Create notebook container with updated classes
    const container = document.createElement("div");
    container.className = "notebook flex flex-col w-full h-full";
    container.setAttribute("role", "list");
    container.setAttribute("aria-label", "Notebook cells");

    // Create toolbar with updated classes
    const toolbar = document.createElement("div");
    toolbar.className = "notebook-toolbar";

    const addCellButton = document.createElement("button");
    addCellButton.className = "add-cell-button";
    addCellButton.textContent = "Add Cell";
    addCellButton.onclick = () => this.addCell();

    toolbar.appendChild(addCellButton);
    container.appendChild(toolbar);

    // Create cells container
    const cellsContainer = document.createElement("div");
    cellsContainer.className = "flex-1 overflow-auto";
    container.appendChild(cellsContainer);

    element.appendChild(container);
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
    const currentCells = this.state$.cells.get();
    this.syncCellElements(container, currentCells);
    this.updateFocus();
  }

  private syncCellElements(container: HTMLElement, currentCells: Cell[]) {
    const existingIds = new Set(this.cellElements.keys());
    const newIds = new Set(currentCells.map((cell) => cell.id));

    // Remove cells that no longer exist
    this.removeDeletedCells(existingIds, newIds);

    // Add or update cells
    currentCells.forEach((cell, index) => {
      if (this.cellElements.has(cell.id)) {
        this.updateExistingCell(container, cell, index);
      } else {
        this.addNewCell(container, cell, index);
      }
    });
  }

  private removeDeletedCells(existingIds: Set<string>, newIds: Set<string>) {
    for (const id of existingIds) {
      if (!newIds.has(id)) {
        const element = this.cellElements.get(id);
        if (element?.parentElement) {
          element.parentElement.removeChild(element);
        }
        this.cellElements.delete(id);
      }
    }
  }

  private updateExistingCell(
    container: HTMLElement,
    cell: Cell,
    index: number,
  ) {
    const element = this.cellElements.get(cell.id)!;
    this.updateCellPosition(container, element, index);
    this.updateCellOutput(element, cell);
  }

  private updateCellPosition(
    container: HTMLElement,
    element: HTMLElement,
    targetIndex: number,
  ) {
    const currentIndex = Array.from(container.children).indexOf(element);
    if (currentIndex !== targetIndex) {
      container.insertBefore(element, container.children[targetIndex] || null);
    }
  }

  private addNewCell(container: HTMLElement, cell: Cell, index: number) {
    const cellElement = this.createCellElement(cell);
    this.cellElements.set(cell.id, cellElement);

    if (index === container.children.length) {
      container.appendChild(cellElement);
    } else {
      container.insertBefore(cellElement, container.children[index]);
    }
  }

  private updateFocus() {
    const focusedId = this.state$.focusedCellId.get();
    if (focusedId) {
      const editor = this.cellElements
        .get(focusedId)
        ?.querySelector(".cell-editor") as HTMLElement;
      editor?.focus();
    }
  }

  private updateCellOutput(element: HTMLElement, cell: Cell) {
    const outputContainer = this.getOrCreateOutputContainer(element);
    outputContainer.innerHTML = "";

    if (cell.output) {
      this.renderCellLogs(outputContainer, cell.output.logs);
      this.renderCellResult(outputContainer, cell.output.result);
    }

    this.updateErrorDisplay(element, cell.error);
  }

  private getOrCreateOutputContainer(element: HTMLElement): HTMLElement {
    let outputContainer = element.querySelector(
      ".output-container",
    ) as HTMLElement;
    if (!outputContainer) {
      outputContainer = document.createElement("div");
      outputContainer.className = "output-container border-t border-border";
      element.querySelector(".border")?.appendChild(outputContainer);
    }
    return outputContainer;
  }

  private renderCellLogs(container: HTMLElement, logs: string[]) {
    if (logs.length === 0) return;

    const logsContainer = document.createElement("div");
    logsContainer.className = "output-logs";

    logs.forEach((log) => {
      const logLine = document.createElement("div");
      logLine.className = "output-log-line";
      logLine.textContent = log;
      logsContainer.appendChild(logLine);
    });

    container.appendChild(logsContainer);
  }

  private renderCellResult(container: HTMLElement, result: any) {
    if (result === undefined) return;

    const resultContainer = document.createElement("div");
    resultContainer.className = "output-result";
    resultContainer.textContent =
      typeof result === "object"
        ? JSON.stringify(result, null, 2)
        : String(result);

    container.appendChild(resultContainer);
  }

  private updateErrorDisplay(element: HTMLElement, error: string | undefined) {
    const existingError = element.querySelector(
      ".error-container",
    ) as HTMLElement;

    if (error) {
      if (!existingError) {
        const errorContainer = document.createElement("div");
        errorContainer.className = "error-container";
        errorContainer.setAttribute("role", "alert");
        errorContainer.textContent = error;
        element.querySelector(".cell-container")?.appendChild(errorContainer);
      } else {
        existingError.textContent = error;
      }
    } else if (existingError) {
      existingError.remove();
    }
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
    if (this.updateRAF) {
      cancelAnimationFrame(this.updateRAF);
    }

    // Clean up editor instances
    this.editorInstances.forEach((view) => view.destroy());
    this.editorInstances.clear();

    // Clear element pool
    this.elementPool = [];

    // Clean up other resources
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
