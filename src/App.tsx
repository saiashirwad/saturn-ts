import { JavaScriptExecutor } from "./lib/js-executor"
import { initializeTheme } from "./lib/theme"

initializeTheme()

async function example() {
  const executor = new JavaScriptExecutor()

  try {
    const result1 = await executor.execute(`
      const x = Math.floor(Math.random() * 100);
      console.log('Generated:', x);
      return { x }
    `)
    console.log("Result 1:", result1)

    const result2 = await executor.execute(`
        const lol = Math.random()
        console.log('lol is:', lol)
        return { lol }
    `)
    console.log("Result 2:", result2)

    const pokemonExample = await executor.execute(`
      const name = 'pikachu'
      const pokemon = await fetch('https://pokeapi.co/api/v2/pokemon/' + name)
      const data = await pokemon.json()
      console.log('data is:', data)
      return { data }
    `)
    console.log("Pokemon example:", pokemonExample)

    // const result2 = await executor
    //   .execute(`
    //   console.log('Window is:', window);
    //   console.log('Self is:', self);
    // `)
    //   .catch((err) => err)
    // console.log("Result 2:", result2)

    // const result3 = await executor
    //   .execute(`
    //   while(true) {}
    // `)
    //   .catch((err) => err)
  } finally {
    executor.terminate()
  }
}

function App() {
  return (
    <div>
      <div>hi</div>
      <button onClick={example}>hi</button>
      {/* <Notebook /> */}
    </div>
  )
}

export default App
