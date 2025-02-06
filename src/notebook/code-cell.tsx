import type { editor } from "monaco-editor"
import * as React from "react"
import { memo, useCallback, useRef } from "react"
import { registerGlobalVariable } from "../command/command-store"
import { Monaco } from "../monaco/monaco-editor"
import { evaluateCode } from "../quickjs"
import { type Cell as CellType, useNotebookStore } from "./notebook-store"

interface CodeCellProps {
  cell: CellType
  index: number
  isFocused: boolean
}

const ForwardedCodeCell = React.forwardRef<HTMLDivElement, CodeCellProps>(
  ({ cell, isFocused }, ref) => {
    const updateCell = useNotebookStore((state) => state.updateCell)
    const globals = useNotebookStore((state) => state.globalObject)
    const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)

    const handleEditorDidMount = useCallback(
      (editor: editor.IStandaloneCodeEditor) => {
        editorRef.current = editor
      },
      [],
    )

    React.useEffect(() => {
      if (isFocused) {
        editorRef.current?.focus()
      }
    }, [isFocused])

    const run = useCallback(
      (code: string) =>
        runCode(code, globals, (result) => {
          updateCell(cell.id, { output: result.output })
          for (const [key, value] of Object.entries(result.output)) {
            registerGlobalVariable(key, value)
          }
        }),
      [cell.id, updateCell, globals],
    )

    return (
      <div
        ref={ref}
        className="flex flex-col border-b border-gray-200 dark:border-gray-700"
      >
        <div className="flex">
          <div className="p-2 select-none flex flex-col items-end text-gray-400 dark:text-gray-500">
            <button
              className="text-green-700 dark:text-green-600 hover:text-gray-600"
              onClick={() => run(cell.content)}
              title="Run cell"
            >
              ▶
            </button>
          </div>

          <div className="flex-1 pl-5">
            <Monaco
              language="typescript"
              value={cell.content}
              onChange={(value) => {
                updateCell(cell.id, { content: value ?? "" })
              }}
              onMount={handleEditorDidMount}
            />
          </div>
        </div>

        {cell.output && (
          <div className="flex pl-10">
            <div className="flex-1 p-2 font-mono text-sm text-gray-800 dark:text-gray-300 bg-gray-50 dark:bg-[#252526] border-t border-gray-200 dark:border-gray-700">
              <pre>{JSON.stringify(cell.output, null, 2)}</pre>
            </div>
          </div>
        )}
      </div>
    )
  },
)

ForwardedCodeCell.displayName = "CodeCell"

// Then wrap it with memo
export const CodeCell = memo(ForwardedCodeCell)

export async function runCode(
  code: string,
  globals: Record<string, any>,
  onResult: (result: {
    type: "success" | "error"
    output: any
    error: any
  }) => void,
) {
  try {
    const result = await evaluateCode(code, globals)
    if (result.type === "success") {
      onResult({
        type: "success",
        output: result.output,
        error: null,
      })
      let newGlobals: Record<string, any> = {}
      for (const [key, value] of Object.entries(result.output)) {
        newGlobals[key] = value
      }
      onResult({
        type: "success",
        output: newGlobals,
        error: null,
      })
    } else {
      onResult({
        type: "error",
        output: {
          error: result.error,
        },
        error: result.error,
      })
    }
  } catch (error) {
    onResult({
      type: "error",
      output: {
        error: error,
      },
      error: error,
    })
  }
}
