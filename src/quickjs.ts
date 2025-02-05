import { getQuickJS, QuickJSContext } from "quickjs-emscripten"

let quickJSInstance: Awaited<ReturnType<typeof getQuickJS>> | null = null
let vmInstance: QuickJSContext | null = null

export async function getQuickJSInstance() {
  if (!quickJSInstance) {
    console.log("create quickjs instance")
    quickJSInstance = await getQuickJS()
  }
  return quickJSInstance
}

export function getVM(): QuickJSContext {
  if (!vmInstance && quickJSInstance) {
    vmInstance = quickJSInstance.newContext()
  }
  if (!vmInstance) {
    throw new Error("VM not initialized")
  }
  return vmInstance
}

export function disposeVM() {
  if (vmInstance) {
    vmInstance.dispose()
    vmInstance = null
  }
}
