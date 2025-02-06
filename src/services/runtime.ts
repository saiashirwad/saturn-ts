import { Rx } from "@effect-rx/rx-react"
import * as FetchHttpClient from "@effect/platform/FetchHttpClient"
import { Effect } from "effect"
import * as Layer from "effect/Layer"
import { QuickJS } from "./quickjs"

export const runtime = Rx.runtime(
  Layer.mergeAll(FetchHttpClient.layer, QuickJS.Default),
)

export const saturnHandleRx = Rx.family(
  ({ initialCode }: { initialCode: string }) =>
    runtime.rx((ctx) =>
      Effect.gen(function* () {
        const quickjs = yield* QuickJS

        const initialOutput = yield* quickjs.evalCode(initialCode)

        const output = Rx.writable<any, any>(
          () => initialOutput,
          (ctx, value: string) => ctx.setSelf(value),
        )

        const evalCode = Rx.fn((code: string) =>
          Effect.gen(function* () {
            const result = yield* quickjs.evalCode(code)
            console.log(result)
            yield* ctx.set(output, result)
            return result
          }),
        )

        return {
          output,
          evalCode,
        } as const
      }),
    ),
)

export interface RxSaturnHandle
  extends Rx.Rx.InferSuccess<ReturnType<typeof saturnHandleRx>> {}
