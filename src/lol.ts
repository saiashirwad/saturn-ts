import { Effect, Layer } from "effect"
import { Monaco } from "./services/monaco"

class Something extends Effect.Service<Something>()("app/Something", {
  scoped: Effect.gen(function* () {
    return {
      log: (message: string) =>
        Effect.gen(function* () {
          console.log(message)
        }),
    }
  }),
}) {}

class Lol extends Effect.Service<Lol>()("app/Lol", {
  scoped: Effect.gen(function* () {
    return {
      lol: "lol",
    }
  }),
}) {}

const MainLayer = Layer.mergeAll(Something.Default, Lol.Default, Monaco.Default)

const lol = Effect.gen(function* () {
  const monaco = yield* Monaco
  const editor = yield* monaco.createEditor(document.body)
  console.log(editor)
}).pipe(Effect.scoped, Effect.provide(MainLayer))

Effect.runPromise(lol)
