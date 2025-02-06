import { memo, useCallback } from "react"
import { Monaco } from "./monaco/monaco-editor"
import { evaluateCode } from "./quickjs"
import { type Cell, useNotebookStore } from "./store"
import { useDarkMode } from "./utils/useDarkMode"

export function Notebook() {
  const { theme, toggleTheme } = useDarkMode()
  const cells = useNotebookStore((state) => state.cells)
  const addCell = useNotebookStore((state) => state.addCell)

  return (
    <div
      className={`min-h-screen ${theme === "dark" ? "bg-[#1e1e1e] text-gray-300" : "bg-white text-gray-800"}`}
    >
      <div
        className={`flex items-center justify-between px-2 py-1 border-b ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`}
      >
        <button
          className={`p-1 ${theme === "dark" ? "text-gray-400 hover:text-gray-200" : "text-gray-600 hover:text-gray-800"}`}
          onClick={() => addCell("code")}
          title="Add cell"
        >
          +
        </button>
        <button
          className={`p-1 ${theme === "dark" ? "text-gray-400 hover:text-gray-200" : "text-gray-600 hover:text-gray-800"}`}
          onClick={toggleTheme}
          title="Toggle theme"
        >
          {theme === "dark" ? "☀️" : "🌙"}
        </button>
      </div>

      <div className="flex flex-col w-full">
        {cells.map((cell, index) => (
          <Cell key={cell.id} cell={cell} index={index + 1} theme={theme} />
        ))}
      </div>
    </div>
  )
}

const Cell = memo(
  (props: { cell: Cell; index: number; theme: "light" | "dark" }) => {
    const updateCell = useNotebookStore((state) => state.updateCell)
    const globals = useNotebookStore((state) => state.globalObject)

    const run = useCallback(
      (code: string) =>
        runCode(code, globals, (result) => {
          updateCell(props.cell.id, { output: result.output })
        }),
      [props.cell.id, updateCell, globals],
    )

    return (
      <div
        className={`flex flex-col border-b ${props.theme === "dark" ? "border-gray-700" : "border-gray-200"}`}
      >
        <div className="flex">
          <div
            className={`p-2 select-none flex flex-col items-end ${props.theme === "dark" ? "text-gray-500" : "text-gray-400"}`}
          >
            <button
              className={`${props.theme === "dark" ? "text-green-600" : "text-green-700"} hover:text-gray-600`}
              onClick={() => run(props.cell.content)}
              title="Run cell"
            >
              ▶
            </button>
          </div>

          <div className={`flex-1 pl-5`}>
            <Monaco
              language="typescript"
              value={props.cell.content}
              onChange={(value) => {
                updateCell(props.cell.id, { content: value ?? "" })
              }}
            />
          </div>
        </div>

        {props.cell.output && (
          <div className="flex pl-10">
            <div
              className={`flex-1 p-2 font-mono text-sm ${
                props.theme === "dark"
                  ? "text-gray-300 bg-[#252526] border-gray-700"
                  : "text-gray-800 bg-gray-50 border-gray-200"
              } border-t`}
            >
              <pre>{JSON.stringify(props.cell.output, null, 2)}</pre>
            </div>
          </div>
        )}
      </div>
    )
  },
)

async function runCode(
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
