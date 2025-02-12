import { runtimeContext } from "./context";

export interface WorkerMessage {
  id: string;
  code: string;
  globals: Record<string, any>;
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
  const { id, code, globals } = e.data;
  (self as any).logs = []; // Reset logs for new execution

  // Override console.log to stream logs
  const originalLog = console.log;
  const originalError = console.error;

  console.log = (...args: any[]) => {
    const log = args
      .map((arg) => {
        if (arg instanceof Error) {
          return `${arg.name}: ${arg.message}\n${arg.stack}`;
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
    // Modified wrappedCode to not require exports
    const wrappedCode = `
      return (async () => {
        try {
          // Inject globals into scope
          ${Object.entries(globals)
            .map(([key, value]) => `const ${key} = ${JSON.stringify(value)};`)
            .join("\n")}

          // Execute code and capture last expression result
          let __lastExpressionResult;
          __lastExpressionResult = await (async () => {
            ${code}
          })();
          
          // If the code has an explicit return/export, it will be returned
          // Otherwise, return the last expression result
          return __lastExpressionResult;
        } catch (err) {
          throw err;
        }
      })();
    `;

    const context = {
      ...runtimeContext,
      ...globals,
    };

    const fn = new Function(...Object.keys(context), wrappedCode);
    const result = await fn(...Object.values(context));

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

    console.error("Worker caught error:", errorMessage);

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
