import type { WorkerResponse } from "./js-worker"

interface ExecutionResult {
  result: unknown
  logs: string[]
}

interface ExecutionError {
  error: string
  logs: string[]
}

export class JavaScriptExecutor {
  private worker: Worker | null = null
  private executionMap = new Map<
    string,
    {
      resolve: (value: ExecutionResult) => void
      reject: (reason: ExecutionError) => void
      timeout: number
    }
  >()

  constructor() {
    this.initializeWorker()
  }

  private initializeWorker() {
    try {
      this.worker = new Worker(new URL("./js-worker.ts", import.meta.url), {
        type: "module",
      })
      this.worker.onmessage = this.handleWorkerMessage.bind(this)
      this.worker.onerror = this.handleWorkerError.bind(this)
    } catch (error) {
      console.error("Failed to initialize worker:", error)
      this.worker = null
    }
  }

  private handleWorkerMessage(event: MessageEvent<WorkerResponse>) {
    const { id, success, result, error, logs } = event.data
    const execution = this.executionMap.get(id)

    if (execution) {
      clearTimeout(execution.timeout)
      this.executionMap.delete(id)

      if (success) {
        execution.resolve({ result, logs })
      } else {
        execution.reject({ error: error ?? "Unknown error", logs })
      }
    }
  }

  private handleWorkerError(error: ErrorEvent) {
    console.error("Worker error:", error)
  }

  execute(code: string, timeoutMs = 50000): Promise<ExecutionResult> {
    if (!this.worker) {
      return Promise.reject({
        error: "Worker not initialized",
        logs: [],
      })
    }

    return new Promise((resolve, reject) => {
      const id = Math.random().toString(36).slice(2)

      const timeout = window.setTimeout(() => {
        this.executionMap.delete(id)
        this.worker?.terminate()
        this.initializeWorker()
        reject({ error: "Execution timed out", logs: [] })
      }, timeoutMs)

      this.executionMap.set(id, { resolve, reject, timeout })
      this.worker?.postMessage({ id, code })
    })
  }

  isAlive(): boolean {
    return this.worker !== null
  }

  terminate() {
    this.worker?.terminate()
    this.worker = null
    this.clearPendingExecutions("Executor terminated")
  }

  private clearPendingExecutions(error: string) {
    for (const [id, execution] of this.executionMap) {
      clearTimeout(execution.timeout)
      execution.reject({ error, logs: [] })
      this.executionMap.delete(id)
    }
  }
}
