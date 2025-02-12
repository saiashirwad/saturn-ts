import * as React from "react";
import { memo, useCallback, useRef, useState } from "react";
import { CodemirrorEditor } from "../codemirror/codemirror-editor";
import { JavaScriptExecutor } from "../runtime/js-executor";
import {
  CodeCell,
  setFocusedCell,
  updateCell,
  updateCellAnalysis,
} from "./notebook-store";
import { ChevronDown, ChevronRight } from "lucide-react";
import { hashCode } from "../utils/hash";

interface CodeCellProps {
  cell: CodeCell;
  isFocused: boolean;
  ref: React.Ref<HTMLDivElement>;
}

export const RenderCodeCell = memo(
  ({ cell, isFocused, ref }: CodeCellProps) => {
    if (cell.type !== "code") return null;

    const containerRef = useRef<HTMLDivElement>(null);
    const [showLogs, setShowLogs] = useState(true);
    const [showResult, setShowResult] = useState(true);

    const run = useCallback(
      async (code: string) => {
        // Remove hash comparison temporarily to debug
        try {
          const executor = new JavaScriptExecutor();
          const result = await executor.execute(code);

          // Generate hash after successful execution
          const newHash = hashCode(code);

          // Update cell with new hash and results
          updateCell(cell.id, {
            content: code, // Ensure content is updated
            hash: newHash,
            output: {
              logs: result.logs,
              result: result.result,
            },
            error: null,
          });

          // Update cell analysis with exports
          if (result.result && typeof result.result === "object") {
            updateCellAnalysis(cell.id, {
              exports: Object.entries(result.result).map(([name, value]) => ({
                name,
                value,
                type: typeof value,
              })),
              references: [], // TODO: Parse code to find references
            });
          }
        } catch (error) {
          const newHash = hashCode(code);
          updateCell(cell.id, {
            content: code,
            hash: newHash,
            error: error instanceof Error ? error.message : String(error),
            output: null,
          });
          updateCellAnalysis(cell.id, {
            exports: [],
            references: [],
          });
        }
      },
      [cell.id], // Remove cell.hash from dependencies
    );

    const CollapsibleHeader = ({
      isOpen,
      onClick,
      children,
    }: {
      isOpen: boolean;
      onClick: () => void;
      children: React.ReactNode;
    }) => (
      <button
        onClick={onClick}
        className="flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:bg-accent/50 w-full text-left border-t border-border"
      >
        {isOpen ? (
          <ChevronDown className="h-3 w-3" />
        ) : (
          <ChevronRight className="h-3 w-3" />
        )}
        {children}
      </button>
    );

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
          <CodemirrorEditor
            isFocused={isFocused}
            value={cell.content}
            onChange={(value) => {
              updateCell(cell.id, { content: value ?? "" });
            }}
            onFocus={() => {
              setFocusedCell(cell.id);
            }}
            onBlur={async () => {
              await run(cell.content);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && event.shiftKey) {
                event.preventDefault();
                run(cell.content);
              }
            }}
          />

          {cell.output && (
            <div className="flex flex-col">
              {cell.output.logs?.length > 0 && (
                <>
                  <CollapsibleHeader
                    isOpen={showLogs}
                    onClick={() => setShowLogs(!showLogs)}
                  >
                    Console Output ({cell.output.logs.length} lines)
                  </CollapsibleHeader>
                  {showLogs && (
                    <div className="flex-1 px-2 py-1 font-mono text-xs bg-background text-foreground">
                      {cell.output.logs.map((log: string, i: number) => (
                        <div key={i} className="whitespace-pre-wrap opacity-75">
                          {log}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {cell.output.result !== undefined &&
                cell.output.result !== null && (
                  <>
                    <CollapsibleHeader
                      isOpen={showResult}
                      onClick={() => setShowResult(!showResult)}
                    >
                      Result
                    </CollapsibleHeader>
                    {showResult && (
                      <div className="flex-1 p-2 font-mono text-sm bg-background text-foreground">
                        <pre>{JSON.stringify(cell.output.result, null, 2)}</pre>
                      </div>
                    )}
                  </>
                )}
            </div>
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
