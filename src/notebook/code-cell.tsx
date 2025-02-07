import { use$ } from "@legendapp/state/react"
import { Play, Trash2 } from "lucide-react"
import type { editor } from "monaco-editor"
import * as monaco from "monaco-editor"
import * as React from "react"
import { memo, useCallback, useRef, useEffect } from "react"
import { CodemirrorEditor } from "../codemirror/codemirror-editor"
import {
  commandPalette$,
  registerGlobalVariable,
} from "../command/command-store"
import { JavaScriptExecutor } from "../runtime/js-executor"
import {
  Cell as CellType,
  deleteCell,
  notebook$,
  updateCell,
} from "./notebook-store"

interface CodeCellProps {
  cell: CellType
  index: number
  isFocused: boolean
}

function setupKeybindings(editor: editor.IStandaloneCodeEditor) {
  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyF, () => {}, "")

  monaco.editor.addKeybindingRule({
    keybinding: monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyF,
    command: null,
  })

  editor.addCommand(
    monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK,
    () => {
      commandPalette$.isOpen.set(true)
    },
    "",
  )

  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyP, () => {}, "")
  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyJ, () => {}, "")

  monaco.editor.addKeybindingRule({
    keybinding: monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK,
    command: null,
  })
  monaco.editor.addKeybindingRule({
    keybinding: monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyP,
    command: null,
  })
  monaco.editor.addKeybindingRule({
    keybinding: monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyJ,
    command: null,
  })
}

const ForwardedCodeCell = React.forwardRef<HTMLDivElement, CodeCellProps>(
  ({ cell, isFocused }, ref) => {
    const globals = use$(notebook$.globalObject)
    const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    // Focus management
    useEffect(() => {
      if (isFocused) {
        editorRef.current?.focus()
        containerRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        })
      }
    }, [isFocused])

    const handleEditorDidMount = useCallback(
      (editor: editor.IStandaloneCodeEditor) => {
        editorRef.current = editor
        setupKeybindings(editor)

        // If this is a newly created cell, focus it
        if (isFocused) {
          setTimeout(() => editor.focus(), 0)
        }
      },
      [isFocused],
    )

    const run = useCallback(
      (code: string) =>
        runCode(code, globals, (result) => {
          updateCell(cell.id, { output: result.output })
          for (const [key, value] of Object.entries(result.output)) {
            registerGlobalVariable(key, value)
          }
        }),
      [cell.id, globals],
    )

    return (
      <div
        ref={ref}
        className="flex px-4 pt-4 gap-2"
        role="region"
        aria-label={`Code cell ${cell.id}`}
      >
        <div className="flex flex-col items-center gap-2">
          <button
            className="text-primary hover:text-primary/80 text-sm border p-2 rounded hover:bg-primary/10"
            onClick={() => run(cell.content)}
            title="Run cell"
            aria-label="Run code in cell"
          >
            <Play className="w-3 h-3" />
          </button>
          <button
            className="text-primary hover:text-primary/80 text-xs border p-2 rounded hover:bg-primary/10"
            onClick={() => deleteCell(cell.id)}
            aria-label="Delete cell"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
        <div
          ref={containerRef}
          className="border border-border rounded-md overflow-hidden flex-1"
          role="textbox"
          aria-label="Code editor"
        >
          <CodemirrorEditor
            id={cell.id}
            isFocused={isFocused}
            language="typescript"
            value={cell.content}
            onChange={(value) => {
              updateCell(cell.id, { content: value ?? "" })
            }}
            onMount={handleEditorDidMount}
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
        </div>
      </div>
    )
  },
)

ForwardedCodeCell.displayName = "CodeCell"

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
  const executor = new JavaScriptExecutor()

  try {
    // Wrap the code to handle exports
    const wrappedCode = `
      const globals = ${JSON.stringify(globals)};
      console.log(globals)
      let exports = {};
      
      // Capture exports
      const rawExports = {};
      Object.defineProperty(globalThis, 'export', {
        set: function(val) {
          // Do nothing - we only care about export const/let
        },
        get: function() {
          return function() {}
        }
      });
      
      Object.defineProperty(globalThis, 'exports', {
        set: function(val) {
          Object.assign(rawExports, val);
        },
        get: function() {
          return rawExports;
        }
      });
      
      // Run the actual code
      ${code}
      
      // Return both globals and exports
      ({...globals, ...rawExports});
    `

    const result = await executor.execute(wrappedCode)

    onResult({
      type: "success",
      output: result.result as Record<string, any>,
      error: null,
    })

    if (result.logs.length > 0) {
      onResult({
        type: "success",
        output: {
          ...(result.result as Record<string, any>),
          logs: result.logs,
        },
        error: null,
      })
    }
  } catch (error) {
    onResult({
      type: "error",
      output: {
        error: error instanceof Error ? error.message : String(error),
        logs: (error as ExecutionError)?.logs || [],
      },
      error: error,
    })
  } finally {
    executor.terminate()
  }
}

interface ExecutionError {
  error: string
  logs: string[]
}
