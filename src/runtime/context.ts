export function createRuntimeContext(context: Record<string, any>) {
  return {
    console: {
      log: (...args: any[]) => {
        const formatted = args
          .map((arg) =>
            typeof arg === "object"
              ? JSON.stringify(arg, null, 2)
              : String(arg),
          )
          .join(" ");
        (self as any).logs.push(formatted);
      },
      error: (...args: any[]) => {
        const formatted = args
          .map((arg) =>
            typeof arg === "object"
              ? JSON.stringify(arg, null, 2)
              : String(arg),
          )
          .join(" ");
        (self as any).logs.push(`Error: ${formatted}`);
      },
    },
    fetch: async (url: string) => {
      const response = await self.fetch(url);
      const text = await response.text();
      try {
        return {
          ok: response.ok,
          status: response.status,
          statusText: response.statusText,
          json: () => JSON.parse(text),
          text: () => text,
        };
      } catch (e) {
        return {
          ok: response.ok,
          status: response.status,
          statusText: response.statusText,
          text: () => text,
        };
      }
    },
    Math,
    JSON,
    context,
  };
}

export const runtimeContext = createRuntimeContext({});
