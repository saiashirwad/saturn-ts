import { Data, Effect, GlobalValue } from "effect"
import { getQuickJS } from "quickjs-emscripten"

const semaphore = GlobalValue.globalValue("app/QuickJS/semaphore", () =>
  Effect.unsafeMakeSemaphore(1),
)

class ExecError extends Data.TaggedError("ExecError")<{
  readonly error: any
}> {}

export class QuickJS extends Effect.Service<QuickJS>()("app/QuickJS", {
  accessors: true,
  scoped: Effect.gen(function* () {
    // only one instance of quickjs can be created at a time
    yield* Effect.acquireRelease(semaphore.take(1), () => semaphore.release(1))

    const quickjs = yield* Effect.promise(() => getQuickJS())

    const vm = yield* Effect.acquireRelease(
      Effect.sync(() => quickjs.newContext()),
      (vm) =>
        Effect.sync(() => {
          vm.dispose()
        }),
    )

    const evalCode = (code: string) =>
      Effect.sync(() => vm.evalCode(code)).pipe(
        Effect.flatMap((result) =>
          Effect.gen(function* () {
            console.log("hi")
            if (result.error) {
              return yield* Effect.fail(new ExecError({ error: result.error }))
            }
            console.log(vm.getString(result.value))
            return yield* Effect.succeed(vm.dump(result.value))
          }),
        ),
      )

    return { vm, evalCode }
  }),
}) {}
