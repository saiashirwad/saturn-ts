import { Effect, GlobalValue } from "effect"

const semaphore = GlobalValue.globalValue("app/WebContainer/semaphore", () =>
  Effect.unsafeMakeSemaphore(1),
)

export class WebContainer extends Effect.Service<WebContainer>()(
  "app/Webcontainer",
  {
    accessors: true,
    scoped: Effect.gen(function* () {
      yield* Effect.acquireRelease(semaphore.take(1), () =>
        semaphore.release(1),
      )

      return { hi: "there" }
    }),
  },
) {}
