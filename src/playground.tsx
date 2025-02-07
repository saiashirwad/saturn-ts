import { JavaScriptExecutor } from "./runtime/js-executor"

const executor = new JavaScriptExecutor()

export function Playground() {
  return (
    <div>
      <button
        onClick={async () => {
          const result1 = await executor.execute(`
const sum = (a, b) => a + b
return sum(1, 2)
`)
          console.log(result1)

          const result2 = await executor.execute(`
const pikachu = await fetch("https://pokeapi.co/api/v2/pokemon/pikachu")
const data = await pikachu.json()
return data
`)

          console.log(result2)
        }}
      >
        execute
      </button>
    </div>
  )
}
