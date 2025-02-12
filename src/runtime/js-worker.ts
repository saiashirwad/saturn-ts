import { runtimeContext } from "./context";

export interface WorkerMessage {
  id: string;
  code: string;
  globals: Array<{ name: string; value: any }>;
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

self.onmessage = async (e: MessageEvent<WorkerMessage>) => {
  const { id, code, globals } = e.data;
  const logs: string[] = [];

  const originalLog = console.log;
  const originalError = console.error;

  console.log = (...args: any[]) => {
    const log = args
      .map((arg) => {
        if (arg instanceof Error) {
          return `${arg.name}: ${arg.message}\n${arg.stack}`;
        }
        return JSON.stringify(arg);
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
          ${globals
            .map(
              ({ name, value }) => `const ${name} = ${JSON.stringify(value)};`,
            )
            .join("\n")}

          let __lastExpressionResult;
          __lastExpressionResult = await (async () => {
            ${code}
          })();

          return __lastExpressionResult;
        } catch (err) {
          throw err;
        }
      })();
    `;

    const context = {
      ...runtimeContext,
    };

    const fn = new Function(...Object.keys(context), wrappedCode);
    const result = await fn(...Object.values(context));

    self.postMessage({
      id,
      type: "result",
      success: true,
      result,
      logs,
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
      logs,
    } as WorkerResponse);
  } finally {
    console.log = originalLog;
    console.error = originalError;
  }
};
