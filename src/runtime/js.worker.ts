interface WorkerRequest {
  id: string
  code: string
}

export interface WorkerResponse {
  id: string
  success: boolean
  result?: unknown
  error?: string
  logs: string[]
}

const logs: string[] = []

// Capture console.log output
const originalConsole = { ...console }
console.log = (...args) => {
  logs.push(args.map((arg) => String(arg)).join(" "))
  originalConsole.log(...args)
}

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const { id, code } = event.data
  logs.length = 0 // Clear logs for new execution

  try {
    // Execute the code
    const result = await eval(code)
    ;(self as any).postMessage({
      id,
      success: true,
      result,
      logs,
    } as WorkerResponse)
  } catch (error) {
    ;(self as any).postMessage({
      id,
      success: false,
      error: error instanceof Error ? error.message : String(error),
      logs,
    } as WorkerResponse)
  }
}
