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
  const originalError = console.error;

  console.log = (...args: any[]) => {
    const log = args
      .map((arg) => {
        if (arg instanceof Error) {
          return arg.stack || arg.message;
        }
        return typeof arg === "object"
          ? JSON.stringify(arg, null, 2)
          : String(arg);
      })
      .join(" ");

    self.postMessage({
      id,
      type: "log",
      log,
    } as WorkerResponse);

    originalLog.apply(console, args);
  };

  console.error = (...args: any[]) => {
    console.log(...args); // Use our enhanced console.log for errors too
    originalError.apply(console, args);
  };

  try {
    // Wrap code in async IIFE
    const wrappedCode = `
      return (async () => {
        try {
          ${code}
        } catch (err) {
          console.error(err);
          throw err;
        }
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
    const errorMessage =
      error instanceof Error
        ? `${error.name}: ${error.message}\n${error.stack}`
        : String(error);

    self.postMessage({
      id,
      type: "error",
      success: false,
      error: errorMessage,
      logs: (self as any).logs,
    } as WorkerResponse);
  } finally {
    console.log = originalLog;
    console.error = originalError;
  }
};
