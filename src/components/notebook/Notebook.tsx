import { Component, createSignal, For, onCleanup, onMount } from "solid-js";
import { Cell } from "./Cell";
import { transform } from "../../runtime/find-references";
import { JavaScriptExecutor } from "../../runtime/js-executor";
import type { Cell as CellType, NotebookState } from "../../core/notebook-core";

interface NotebookProps {
  class?: string;
  initialState?: NotebookState;
  onChange?: (state: NotebookState) => void;
}

export const Notebook: Component<NotebookProps> = (props) => {
  const [state, setState] = createSignal<NotebookState>(
    props.initialState || {
      cells: [],
      focusedCellId: null,
      globals: {},
    },
  );

  // Setup keyboard shortcuts
  onMount(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && e.shiftKey) {
        const cellElement = (e.target as HTMLElement).closest("[data-cell-id]");
        const cellId = cellElement?.getAttribute("data-cell-id");
        if (cellId) {
          executeCell(cellId);
          e.preventDefault();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    onCleanup(() => document.removeEventListener("keydown", handleKeyDown));
  });

  const addCell = (aboveId?: string) => {
    const newCell: CellType = {
      id: crypto.randomUUID(),
      type: "code",
      content: "",
    };

    setState((prev) => {
      const cells = [...prev.cells];
      if (aboveId) {
        const index = cells.findIndex((cell) => cell.id === aboveId);
        cells.splice(index + 1, 0, newCell);
      } else {
        cells.push(newCell);
      }
      return { ...prev, cells };
    });

    return newCell.id;
  };

  const updateCell = (id: string, content: string) => {
    setState((prev) => {
      const cells = prev.cells.map((cell) =>
        cell.id === id ? { ...cell, content } : cell,
      );
      return { ...prev, cells };
    });
  };

  const deleteCell = (id: string) => {
    setState((prev) => {
      const cells = prev.cells.filter((cell) => cell.id !== id);
      return { ...prev, cells };
    });
  };

  const executeCell = async (id: string) => {
    const currentState = state();
    const cell = currentState.cells.find((c) => c.id === id);
    if (!cell) return;

    try {
      const logs: string[] = [];
      const executor = new JavaScriptExecutor({
        onLog: (log) => {
          console.log(log);
          logs.push(log);
        },
      });

      const { code: transformedCode, references } =
        (await transform(
          cell.content,
          new Set(Object.keys(currentState.globals)),
          "",
        )) || [];

      const result = await executor.execute(
        transformedCode,
        Object.entries(currentState.globals).map(([name, value]) => ({
          name,
          value,
        })),
      );

      const exports =
        result.result && typeof result.result === "object"
          ? Object.entries(result.result).map(([name, value]) => ({
              name,
              value,
              type: typeof value,
            }))
          : [];

      setState((prev) => {
        const cells = prev.cells.map((c) =>
          c.id === id
            ? {
                ...c,
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
              }
            : c,
        );

        const newGlobals = { ...prev.globals };
        exports.forEach(({ name, value }) => {
          newGlobals[name] = value;
        });

        return {
          ...prev,
          cells,
          globals: newGlobals,
        };
      });
    } catch (err) {
      const error = err as Error;
      setState((prev) => {
        const cells = prev.cells.map((c) =>
          c.id === id
            ? {
                ...c,
                error: error.message,
                output: { result: null, logs: [] },
                analysis: { exports: [], references: [] },
              }
            : c,
        );
        return { ...prev, cells };
      });
    }
  };

  return (
    <div class={`notebook flex flex-col w-full h-full ${props.class || ""}`}>
      <div class="notebook-toolbar">
        <button class="add-cell-button" onClick={() => addCell()}>
          Add Cell
        </button>
      </div>
      <div class="flex-1 overflow-auto" role="list" aria-label="Notebook cells">
        <For each={state().cells}>
          {(cell) => (
            <Cell
              cell={cell}
              onExecute={executeCell}
              onContentChange={updateCell}
            />
          )}
        </For>
      </div>
    </div>
  );
};
