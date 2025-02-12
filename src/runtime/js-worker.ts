import { runtimeContext } from "./context";

export interface WorkerMessage {
  id: string;
  code: string;
}

export interface WorkerResponse {
  id: string;
  success: boolean;
  result?: any;
  error?: string;
  logs: string[];
  exports?: string[]; // Track exported variable names
}

export type ContextType = typeof runtimeContext;

self.onmessage = async (e: MessageEvent<WorkerMessage>) => {
  const { id, code } = e.data;
  (self as any).logs = [];

  try {
    // Wrap code in async function and ensure it returns an object
    const fn = new Function(
      ...Object.keys(runtimeContext),
      `return (async () => {
        const result = await (async () => {
          ${code}
        })();
        
        // If result is undefined or null, return empty object
        if (result == null) return {};
        
        // If result isn't an object, wrap it in default export
        if (typeof result !== 'object') {
          return { default: result };
        }
        
        return result;
      })()`,
    );

    const result = await fn(...Object.values(runtimeContext));

    const response: WorkerResponse = {
      id,
      success: true,
      result,
      logs: (self as any).logs,
      exports: Object.keys(result || {}),
    };
    self.postMessage(response);
  } catch (error) {
    const response: WorkerResponse = {
      id,
      success: false,
      error: error instanceof Error ? error.message : String(error),
      logs: (self as any).logs,
      exports: [],
    };
    self.postMessage(response);
  }
};
