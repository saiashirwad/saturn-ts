export interface WorkerMessage {
  id: string
  code: string
}

export interface WorkerResponse {
  id: string
  success: boolean
  result?: any
  error?: string
  logs: string[]
}

const context = {
  console: {
    log: (...args: any[]) => {
      const formatted = args
        .map((arg) =>
          typeof arg === "object" ? JSON.stringify(arg, null, 2) : String(arg),
        )
        .join(" ")
      ;(self as any).logs.push(formatted)
    },
    error: (...args: any[]) => {
      const formatted = args
        .map((arg) =>
          typeof arg === "object" ? JSON.stringify(arg, null, 2) : String(arg),
        )
        .join(" ")
      ;(self as any).logs.push(`Error: ${formatted}`)
    },
  },
  fetch: async (url: string) => {
    const response = await self.fetch(url)
    const text = await response.text()
    try {
      return {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        json: () => JSON.parse(text),
        text: () => text,
      }
    } catch (e) {
      return {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        text: () => text,
      }
    }
  },
  Math,
  JSON,
}

export type ContextType = typeof context

self.onmessage = async (e: MessageEvent<WorkerMessage>) => {
  const { id, code } = e.data
  ;(self as any).logs = []

  try {
    const fn = new Function(
      ...Object.keys(context),
      `return (async () => {
        ${code}
      })()`,
    )

    const result = await fn(...Object.values(context))

    const response: WorkerResponse = {
      id,
      success: true,
      result: result ?? (self as any).logs[0], // Fallback to first log if no result
      logs: (self as any).logs,
    }
    self.postMessage(response)
  } catch (error) {
    const response: WorkerResponse = {
      id,
      success: false,
      error: error instanceof Error ? error.message : String(error),
      logs: (self as any).logs,
    }
    self.postMessage(response)
  }
}
