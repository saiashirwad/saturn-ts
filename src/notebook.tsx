import { Editor } from "@monaco-editor/react"
import { memo } from "react"
import { evaluateCode } from "./quickjs"
import { type Cell, useNotebookStore } from "./store"

export function Notebook() {
  const cells = useNotebookStore((state) => state.cells)
  const addCell = useNotebookStore((state) => state.addCell)
  return (
    <div className="min-h-screen bg-[#1e1e1e] text-gray-300">
      <div className="flex items-center px-2 py-1 border-b border-gray-700">
        <button
          className="p-1 text-gray-400 hover:text-gray-200"
          onClick={() => addCell("code")}
          title="Add cell"
        >
          +
        </button>
      </div>

      <div className="flex flex-col w-full">
        {cells.map((cell, index) => (
          <Cell key={cell.id} cell={cell} index={index + 1} />
        ))}
      </div>
    </div>
  )
}

const Cell = memo((props: { cell: Cell; index: number }) => {
  const updateCell = useNotebookStore((state) => state.updateCell)
  const updateGlobalObject = useNotebookStore(
    (state) => state.updateGlobalObject,
  )
  const globals = useNotebookStore((state) => state.globalObject)

  const runCode = async () => {
    try {
      const result = await evaluateCode(props.cell.content, globals)
      if (result.type === "success") {
        updateCell(props.cell.id, { output: result.output })
        console.log(result.output)
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
    <div className="flex flex-col border-b border-gray-700">
      <div className="flex">
        <div className="w-16 p-2 text-gray-500 select-none flex flex-col items-end">
          <div className="flex items-center gap-1">
            <button
              className="text-gray-400 hover:text-gray-200"
              onClick={runCode}
              title="Run cell"
            >
              ▶
            </button>
            [{props.index}]
          </div>
        </div>

        <div className="flex-1 bg-[#1e1e1e]">
          <Editor
            defaultValue={props.cell.content}
            language="typescript"
            theme="vs-dark"
            height="200px"
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
              },
            }}
            onChange={(value) => updateCell(props.cell.id, { content: value })}
          />
        </div>
      </div>

      {props.cell.output && (
        <div className="flex">
          <div className="w-16 p-2 flex items-center justify-end gap-1">
            <span className="text-green-500">✓</span>
            <span className="text-xs text-gray-500">0.0s</span>
          </div>
          <div className="flex-1 p-2 font-mono text-sm text-gray-300 bg-[#252526] border-t border-gray-700">
            <pre>{JSON.stringify(props.cell.output, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  )
})
