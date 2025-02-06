import { Editor } from "@monaco-editor/react"
import { memo, useEffect, useState } from "react"
import { evaluateCode } from "./quickjs"
import { type Cell, useNotebookStore } from "./store"

export function Notebook() {
  const [theme, setTheme] = useState<"light" | "dark">(
    window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light",
  )
  const cells = useNotebookStore((state) => state.cells)
  const addCell = useNotebookStore((state) => state.addCell)

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    const handleChange = (e: MediaQueryListEvent) => {
      setTheme(e.matches ? "dark" : "light")
    }
    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [])

  const toggleTheme = () => {
    setTheme((current) => (current === "dark" ? "light" : "dark"))
  }

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

      <div className={"flex flex-col w-full"}>
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
    const updateGlobals = useNotebookStore((state) => state.updateGlobalObject)
    const globals = useNotebookStore((state) => state.globalObject)

    const calculateEditorHeight = (content: string) => {
      const lineCount = content.split("\n").length
      const lineHeight = 20 // pixels per line
      const padding = 15 // additional padding (top + bottom)
      return Math.max(lineCount * lineHeight + padding, 50) // minimum height of 50px
    }

    const runCode = async () => {
      try {
        const result = await evaluateCode(props.cell.content, globals)
        if (result.type === "success") {
          updateCell(props.cell.id, { output: result.output })
          let newGlobals: Record<string, any> = {}
          for (const [key, value] of Object.entries(result.output)) {
            newGlobals[key] = value
          }
          updateGlobals(newGlobals)
        } else {
          updateCell(props.cell.id, {
            output: {
              error: result.error,
            },
          })
        }
      } catch (error) {
        updateCell(props.cell.id, {
          output: {
            error: error,
          },
        })
      }
    }

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
              onClick={runCode}
              title="Run cell"
            >
              ▶
            </button>
          </div>

          <div
            className={`flex-1 ${props.theme === "dark" ? "bg-[#1e1e1e]" : "bg-white"} pl-5`}
          >
            <Editor
              defaultValue={props.cell.content}
              language="typescript"
              theme={props.theme === "dark" ? "vs-dark" : "vs-light"}
              height={`${calculateEditorHeight(props.cell.content)}px`}
              value={props.cell.content}
              options={{
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                fontSize: 14,
                lineNumbers: "off",
                glyphMargin: false,
                folding: false,
                padding: { top: 10, bottom: 5 },
                lineDecorationsWidth: 0,
                renderLineHighlight: "none",
                overviewRulerBorder: false,
                hideCursorInOverviewRuler: true,
                overviewRulerLanes: 0,
                scrollbar: {
                  vertical: "hidden",
                  horizontal: "hidden",
                  alwaysConsumeMouseWheel: false,
                  handleMouseWheel: false,
                },
                mouseWheelScrollSensitivity: 0,
                fixedOverflowWidgets: true,
              }}
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
