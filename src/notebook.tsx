import { Editor } from "@monaco-editor/react"
import { memo } from "react"
import { evaluateCode } from "./quickjs"
import { type Cell, useNotebookStore } from "./store"
import { createId } from "@paralleldrive/cuid2"

export function Notebook() {
  const cells = useNotebookStore((state) => state.cells)
  const addCell = useNotebookStore((state) => state.addCell)
  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <button
          className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={() => addCell("code")}
        >
          Add Cell
        </button>
      </div>
      {cells.map((cell) => (
        <Cell key={cell.id} cell={cell} />
      ))}
    </div>
  )
}

const Cell = memo((props: { cell: Cell }) => {
  const updateCell = useNotebookStore((state) => state.updateCell)
  const updateGlobalObject = useNotebookStore(
    (state) => state.updateGlobalObject,
  )
  const globals = useNotebookStore((state) => state.globalObject)

  const runCode = async () => {
    try {
      const result = await evaluateCode(props.cell.content, globals)
      console.log({ result })
      if (result.type === "success") {
        updateCell(props.cell.id, { output: result.output })
      } else {
        updateCell(props.cell.id, {
          output: result.error,
        })
      }
    } catch (error) {
      updateCell(props.cell.id, {
        output: JSON.stringify(error, null, 2),
      })
    }
  }

  return (
    <div className="flex flex-col gap-2 p-4 border border-gray-200 rounded-lg">
      <div className="flex gap-2">
        <button className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600">
          Delete
        </button>
        <button
          className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={runCode}
        >
          Run
        </button>
      </div>

      <div className="h-[200px] border border-gray-300 rounded">
        <Editor
          defaultValue={props.cell.content}
          language="typescript"
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            fontSize: 14,
          }}
          onChange={(value) => updateCell(props.cell.id, { content: value })}
        />
      </div>

      {props.cell.output && (
        <div className="mt-2 p-3 bg-gray-100 rounded">
          <pre className="whitespace-pre-wrap font-mono text-sm">
            {JSON.stringify(props.cell.output, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
})
