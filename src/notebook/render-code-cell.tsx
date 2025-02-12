import JsonView from "@uiw/react-json-view";
import { ChevronDown, ChevronRight, Play } from "lucide-react";
import * as React from "react";
import { CSSProperties, memo, useCallback, useRef } from "react";
import { CodemirrorEditor } from "../codemirror/codemirror-editor";
import { JavaScriptExecutor } from "../runtime/js-executor";
import { hashCode } from "../utils/hash";
import {
  CodeCell,
  setFocusedCell,
  toggleCellLogs,
  toggleCellOutput,
  updateCell,
  updateCellAnalysis,
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
              // onBlur={async () => {
              //   await run(cell.content);
              // }}
              onKeyDown={(event) => {
                if (event.key === "Enter" && event.shiftKey) {
                  event.preventDefault();
                  run(cell.content);
                }
              }}
            />
          </div>

          {cell.output && (
            <div className="flex flex-col">
              {cell.output.logs?.length > 0 && (
                <>
                  <CollapsibleHeader
                    isOpen={cell.showLogs}
                    onClick={() => toggleCellLogs(cell.id)}
                  >
                    Console Output ({cell.output.logs.length} lines)
                  </CollapsibleHeader>
                  {cell.showLogs && (
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
                      isOpen={cell.showOutput}
                      onClick={() => toggleCellOutput(cell.id)}
                    >
                      Result
                    </CollapsibleHeader>
                    {cell.showOutput && (
                      <div className="flex-1 p-2 font-mono text-xs bg-background text-foreground">
                        <JsonView
                          value={cell.output.result}
                          displayDataTypes={false}
                          collapsed={false}
                          displayObjectSize={false}
                          enableClipboard={false}
                          style={catppuccin}
                        />
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

const catppuccin: CSSProperties & { [key: string]: string } = {
  "--w-rjv-color": "#cdd6f4", // Catppuccin text
  "--w-rjv-key-number": "#89b4fa", // Catppuccin blue
  "--w-rjv-key-string": "#89dceb", // Catppuccin sky
  "--w-rjv-line-color": "#45475a", // Catppuccin surface1
  "--w-rjv-arrow-color": "#6c7086", // Catppuccin overlay0
  "--w-rjv-edit-color": "var(--w-rjv-color)",
  "--w-rjv-info-color": "#6c70867a", // Catppuccin overlay0 with alpha
  "--w-rjv-update-color": "#89dceb", // Catppuccin sky
  "--w-rjv-copied-color": "#89dceb", // Catppuccin sky
  "--w-rjv-copied-success-color": "#a6e3a1", // Catppuccin green

  "--w-rjv-curlybraces-color": "#bac2de", // Catppuccin subtext0
  "--w-rjv-colon-color": "#bac2de", // Catppuccin subtext0
  "--w-rjv-brackets-color": "#bac2de", // Catppuccin subtext0
  "--w-rjv-ellipsis-color": "#fab387", // Catppuccin peach
  "--w-rjv-quotes-color": "var(--w-rjv-key-string)",
  "--w-rjv-quotes-string-color": "var(--w-rjv-type-string-color)",

  "--w-rjv-type-string-color": "#f5c2e7", // Catppuccin pink
  "--w-rjv-type-int-color": "#a6e3a1", // Catppuccin green
  "--w-rjv-type-float-color": "#a6e3a1", // Catppuccin green
  "--w-rjv-type-bigint-color": "#a6e3a1", // Catppuccin green
  "--w-rjv-type-boolean-color": "#cba6f7", // Catppuccin mauve
  "--w-rjv-type-date-color": "#a6e3a1", // Catppuccin green
  "--w-rjv-type-url-color": "#89b4fa", // Catppuccin blue
  "--w-rjv-type-null-color": "#cba6f7", // Catppuccin mauve
  "--w-rjv-type-nan-color": "#f38ba8", // Catppuccin red
  "--w-rjv-type-undefined-color": "#cba6f7", // Catppuccin mauve
};
