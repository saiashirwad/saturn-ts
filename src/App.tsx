import { useRxSet } from "@effect-rx/rx-react"
import { Suspense, useState } from "react"
import { SaturnProvider, useOutput, useSaturn } from "./context"

function Editor() {
  const saturn = useSaturn()
  const output = useOutput()
  const evalCode = useRxSet(saturn.evalCode)

  const [code, setCode] = useState(`
    const a = { a: 10, b: 20};
    a
`)

  return (
    <div className="p-5">
      <h1>QuickJS Playground</h1>
      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        className="w-full h-[200px] font-mono mb-2.5"
      />
      <div>
        <button
          onClick={() => evalCode(code)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Run Code
        </button>
      </div>
      <div className="mt-5 p-2.5 bg-gray-100 rounded font-mono">
        <pre>Output: {JSON.stringify(output, null, 2)}</pre>
      </div>
    </div>
  )
}

function App() {
  return (
    <Suspense>
      <SaturnProvider initialCode={"5"}>
        <Editor />
      </SaturnProvider>
    </Suspense>
  )
}

export default App
