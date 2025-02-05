import { useRxSet } from "@effect-rx/rx-react"
import { Suspense, useState } from "react"
import { SaturnProvider, useOutput, useSaturn } from "./context"

function Editor() {
  const saturn = useSaturn()
  const output = useOutput()
  const evalCode = useRxSet(saturn.evalCode)

  const [code, setCode] = useState('"hi"')

  return (
    <div style={{ padding: "20px" }}>
      <h1>QuickJS Playground</h1>
      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        style={{
          width: "100%",
          height: "200px",
          fontFamily: "monospace",
          marginBottom: "10px",
        }}
      />
      <div>
        <button onClick={() => evalCode(code)}>Run Code</button>
      </div>
      <div
        style={{
          marginTop: "20px",
          padding: "10px",
          backgroundColor: "#f5f5f5",
          borderRadius: "4px",
          fontFamily: "monospace",
        }}
      >
        <pre>Output: {JSON.stringify(output, null, 2)}</pre>
      </div>
    </div>
  )
}

function App() {
  return (
    <Suspense>
      <SaturnProvider>
        <Editor />
      </SaturnProvider>
    </Suspense>
  )
}

export default App
