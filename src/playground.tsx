import { JavaScriptExecutor } from "./runtime/js-executor"

const executor = new JavaScriptExecutor()

export function Playground() {
  return (
    <div>
      <button
        onClick={() => {
          executor
            .execute(`
          const sum = (a, b) => a + b
          return sum(1, 2)
        `)
            .then(console.log)
        }}
      >
        execute
      </button>
    </div>
  )
}
