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

interface CodeCellProps {
  cell: CodeCell;
  isFocused: boolean;
  ref: React.Ref<HTMLDivElement>;
}

export const RenderCodeCell = memo(
  ({ cell, isFocused, ref }: CodeCellProps) => {
    if (cell.type !== "code") return null;

    const containerRef = useRef<HTMLDivElement>(null);
    const run = useCellExecution(cell.id);

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
              onChange={(value) => {
                updateCell(cell.id, { content: value ?? "" });
              }}
              onFocus={() => {
                setFocusedCell(cell.id);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" && event.shiftKey) {
                  event.preventDefault();
                  run(cell.content);
                }
              }}
            />
          </div>

          {cell.output && (
            <CellOutput
              output={cell.output}
              showLogs={cell.showLogs}
              showOutput={cell.showOutput}
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
