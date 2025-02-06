import {
  QuickJSContext,
  QuickJSWASMModule,
  getQuickJS,
} from "quickjs-emscripten"

let quickjsInstance: QuickJSWASMModule | null = null
let vm: QuickJSContext | null = null

export async function initQuickJS() {
  if (quickjsInstance && vm) return { quickjsInstance, vm }
  quickjsInstance = await getQuickJS()
  vm = quickjsInstance.newContext()

  return { quickjsInstance, vm }
}

type EvaluationResult =
  | {
      type: "success"
      output: Record<string, any>
    }
  | {
      type: "error"
      error: string
    }

export async function evaluateCode(
  code: string,
  globalObject?: Record<string, any>,
): Promise<EvaluationResult> {
  const { vm } = await initQuickJS()

  if (globalObject) {
    const handles = new Set()
    Object.entries(globalObject).forEach(([key, value]) => {
      const handle = vm.newString(value)
      handles.add(handle)
      vm.setProp(vm.global, key, handle)
    })
  }

  try {
    const result = vm.evalCode(code)

    if (result.error) {
      const errorMessage = vm.dump(result.error)
      result.error.dispose()
      throw new Error(errorMessage)
    }

    const output = vm.dump(result.value)
    result.value.dispose()

    return {
      type: "success",
      output,
    }
  } catch (error) {
    return {
      type: "error",
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

// Handle HMR
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    if (vm) {
      vm.dispose()
    }
    vm = null
    quickjsInstance = null
  })
}
