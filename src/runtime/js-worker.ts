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
}

export type ContextType = typeof runtimeContext;

self.onmessage = async (e: MessageEvent<WorkerMessage>) => {
  const { id, code } = e.data;
  (self as any).logs = [];

  try {
    const fn = new Function(
      ...Object.keys(runtimeContext),
      `return (async () => {
        ${code}
      })()`,
    );

    const result = await fn(...Object.values(runtimeContext));

    const response: WorkerResponse = {
      id,
      success: true,
      result: result ?? (self as any).logs[0], // Fallback to first log if no result
      logs: (self as any).logs,
    };
    self.postMessage(response);
  } catch (error) {
    const response: WorkerResponse = {
      id,
      success: false,
      error: error instanceof Error ? error.message : String(error),
      logs: (self as any).logs,
    };
    self.postMessage(response);
  }
};
