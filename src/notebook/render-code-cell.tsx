import { Play } from "lucide-react";
import * as React from "react";
import { memo, useRef } from "react";
import { CodemirrorEditor } from "../codemirror/codemirror-editor";
import { CellOutput } from "./components/cell-output";
import { useCellExecution } from "./hooks/use-cell-execution";
import {
  CodeCell,
  setFocusedCell,
  toggleCellLogs,
  toggleCellOutput,
  updateCell,
} from "./notebook-store";
import { observer } from "@legendapp/state/react";
import { notebook$ } from "./notebook-store";

interface CodeCellProps {
  cell: CodeCell;
  isFocused: boolean;
  ref: React.Ref<HTMLDivElement>;
}

export const RenderCodeCell = observer(
  ({ cell, isFocused, ref }: CodeCellProps) => {
    if (cell.type !== "code") return null;

    const containerRef = useRef<HTMLDivElement>(null);
    const run = useCellExecution(cell.id);

    const handleChange = React.useCallback(
      (value: string | undefined) => {
        updateCell(cell.id, { content: value ?? "" });
      },
      [cell.id],
    );

    const handleFocus = React.useCallback(() => {
      setFocusedCell(cell.id);
    }, [cell.id]);

    const handleKeyDown = React.useCallback(
      (event: React.KeyboardEvent) => {
        if (event.key === "Enter" && event.shiftKey) {
          event.preventDefault();
          run(cell.content);
        }
      },
      [cell.content, run],
    );

    // Instead of getting the values directly from cell, get them from the store
    const cellState = notebook$.cells.find((c) => c.id.get() === cell.id);
    const showLogs = cellState?.showLogs.get() ?? true;
    const showOutput = cellState?.showOutput.get() ?? true;

    return (
      <div
        ref={ref}
        className="flex px-4 pt-4 gap-2"
        role="region"
        aria-label={`Code cell ${cell.id}`}
      >
        <div
          ref={containerRef}
          className="border border-border rounded-md overflow-hidden flex-1"
          role="textbox"
          aria-label="Code editor"
        >
          <div className="relative">
            <button
              onClick={() => run(cell.content)}
              className="absolute right-2 top-2 p-1 rounded hover:bg-accent/50 text-muted-foreground hover:text-foreground transition-colors z-50"
              title="Run cell (Shift+Enter)"
            >
              <Play className="h-4 w-4" />
            </button>
            <CodemirrorEditor
              isFocused={isFocused}
              value={cell.content}
              onChange={handleChange}
              onFocus={handleFocus}
              onKeyDown={handleKeyDown}
            />
          </div>

          {cell.output && (
            <CellOutput
              output={cell.output}
              showLogs={showLogs}
              showOutput={showOutput}
              onToggleLogs={() => toggleCellLogs(cell.id)}
              onToggleOutput={() => toggleCellOutput(cell.id)}
            />
          )}

          {cell.error && (
            <div
              className="flex-1 p-2 font-mono text-sm bg-red-50 text-red-900 border-t border-red-200"
              role="alert"
            >
              {cell.error}
            </div>
          )}
        </div>
      </div>
    );
  },
);
