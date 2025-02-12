import { use$ } from "@legendapp/state/react";
import * as React from "react";
import { memo, useCallback, useRef } from "react";
import { CodemirrorEditor } from "../codemirror/codemirror-editor";
import { registerGlobalVariable } from "../command/command-store";
import { JavaScriptExecutor } from "../runtime/js-executor";
import {
  CodeCell,
  notebook$,
  setFocusedCell,
  updateCell,
} from "./notebook-store";

interface CodeCellProps {
  cell: CodeCell;
  isFocused: boolean;
  ref: React.Ref<HTMLDivElement>;
}

export const RenderCodeCell = memo(
  ({ cell, isFocused, ref }: CodeCellProps) => {
    const globals = use$(notebook$.globalObject);
    const containerRef = useRef<HTMLDivElement>(null);

    const run = useCallback(
      async (code: string) => {
        try {
          const executor = new JavaScriptExecutor();
          const result = await executor.execute(code);

          updateCell(cell.id, {
            output: result.result,
            error: null,
          });

          // Register any exported values as globals
          if (result.result && typeof result.result === "object") {
            for (const [key, value] of Object.entries(result.result)) {
              registerGlobalVariable(key, value);
            }
          }
        } catch (error) {
          updateCell(cell.id, {
            error: error instanceof Error ? error.message : String(error),
          });
        }
      },
      [cell.id],
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
          />

          {cell.output && (
            <div
              className="flex-1 p-2 font-mono text-sm bg-background text-foreground border-t border-gray-200 dark:border-gray-700"
              role="region"
              aria-label="Cell output"
            >
              <pre>{JSON.stringify(cell.output, null, 2)}</pre>
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

export async function runCode(
  code: string,
  globals: Record<string, any>,
  onResult: (result: {
    type: "success" | "error";
    output: any;
    error: any;
  }) => void,
) {
  const executor = new JavaScriptExecutor();

  try {
    const wrappedCode = `
      ${code}
    `;

    const result = await executor.execute(wrappedCode);
    console.log(result);

    onResult({
      type: "success",
      output: result.result as Record<string, any>,
      error: null,
    });

    if (result.logs.length > 0) {
      onResult({
        type: "success",
        output: {
          ...(result.result as Record<string, any>),
          logs: result.logs,
        },
        error: null,
      });
    }
  } catch (error) {
    console.log(error);
    onResult({
      type: "error",
      output: {
        error: error instanceof Error ? error.message : String(error),
        logs: (error as ExecutionError)?.logs || [],
      },
      error: error,
    });
  } finally {
    executor.terminate();
  }
}

interface ExecutionError {
  error: string;
  logs: string[];
}
