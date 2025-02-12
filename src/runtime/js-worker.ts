import { runtimeContext } from "./context";

export interface WorkerMessage {
  id: string;
  code: string;
}

export interface WorkerResponse {
  id: string;
  type: "log" | "result" | "error";
  success?: boolean;
  result?: any;
  error?: string;
  log?: string;
  exports?: string[];
  logs?: string[];
}

export type ContextType = typeof runtimeContext;

// Initialize logs array
(self as any).logs = [];

self.onmessage = async (e: MessageEvent<WorkerMessage>) => {
  const { id, code } = e.data;
  (self as any).logs = []; // Reset logs for new execution

  // Override console.log to stream logs
  const originalLog = console.log;
  console.log = (...args: any[]) => {
    const log = args
      .map((arg) =>
        typeof arg === "object" ? JSON.stringify(arg, null, 2) : String(arg),
      )
      .join(" ");

    self.postMessage({
      id,
      type: "log",
      log,
    } as WorkerResponse);

    originalLog.apply(console, args);
  };

  try {
    // Wrap code in async IIFE
    const wrappedCode = `
      return (async () => {
        ${code}
      })();
    `;

    const fn = new Function(...Object.keys(runtimeContext), wrappedCode);
    const result = await fn(...Object.values(runtimeContext));

    self.postMessage({
      id,
      type: "result",
      success: true,
      result,
      logs: (self as any).logs,
    } as WorkerResponse);
  } catch (error) {
    self.postMessage({
      id,
      type: "error",
      success: false,
      error: error instanceof Error ? error.message : String(error),
      logs: (self as any).logs,
    } as WorkerResponse);
  } finally {
    console.log = originalLog;
  }
};
