import type { WorkerResponse } from "./js-worker";

interface ExecutionResult {
  result: unknown;
  logs: string[];
}

interface ExecutionError {
  error: string;
  logs: string[];
}

type JavascriptExecutorParams = {
  onLog: (log: string) => void;
};

export class JavaScriptExecutor {
  private onLog: (log: string) => void;
  private worker: Worker | null = null;
  private executionMap = new Map<
    string,
    {
      resolve: (value: ExecutionResult) => void;
      reject: (reason: ExecutionError) => void;
      timeout: number;
      logs: string[];
    }
  >();

  constructor(params: JavascriptExecutorParams) {
    this.initializeWorker();
    this.onLog = params.onLog;
  }

  private initializeWorker() {
    if (this.worker) {
      this.worker.terminate();
    }

    this.worker = new Worker(new URL("./js-worker.ts", import.meta.url), {
      type: "module",
    });

    this.worker.onmessage = this.handleWorkerMessage.bind(this);
    this.worker.onerror = this.handleWorkerError.bind(this);
  }

  private handleWorkerMessage(event: MessageEvent<WorkerResponse>) {
    const { id, type, success, result, error, log } = event.data;
    const execution = this.executionMap.get(id);

    if (!execution) return;

    switch (type) {
      case "log":
        if (log) {
          execution.logs.push(log);
          this.onLog(log);
          console.log(log);
        }
        break;

      case "result":
        clearTimeout(execution.timeout);
        this.executionMap.delete(id);
        execution.resolve({
          result,
          logs: execution.logs,
        });
        break;

      case "error":
        clearTimeout(execution.timeout);
        this.executionMap.delete(id);
        console.error(error);
        execution.reject({
          error: error ?? "Unknown error",
          logs: execution.logs,
        });
        break;
    }
  }

  private handleWorkerError(error: ErrorEvent) {
    console.error("Worker error:", error);
    // Reinitialize worker on error
    this.initializeWorker();
  }

  async execute(
    code: string,
    globals: Array<{ name: string; value: any }> = [],
    timeoutMs = 100000,
  ): Promise<ExecutionResult> {
    if (!this.worker) {
      this.initializeWorker();
    }

    return new Promise((resolve, reject) => {
      const id = Math.random().toString(36).slice(2);

      const timeout = window.setTimeout(() => {
        this.executionMap.delete(id);
        this.initializeWorker(); // Recreate worker on timeout
        reject({
          error: "Execution timed out after " + timeoutMs + "ms",
          logs: [],
        });
      }, timeoutMs);

      this.executionMap.set(id, {
        resolve,
        reject,
        timeout,
        logs: [],
      });

      this.worker!.postMessage({ id, code, globals });
    });
  }

  terminate() {
    this.worker?.terminate();
    this.worker = null;
    this.clearPendingExecutions("Executor terminated");
  }

  private clearPendingExecutions(error: string) {
    for (const [id, execution] of this.executionMap) {
      clearTimeout(execution.timeout);
      execution.reject({ error, logs: [] });
      this.executionMap.delete(id);
    }
  }
}
