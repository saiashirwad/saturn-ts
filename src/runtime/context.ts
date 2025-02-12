export function createRuntimeContext(context: Record<string, any>) {
  const wrappedFetch = async (url: string, options?: RequestInit) => {
    try {
      console.log("Fetching URL:", url);
      const response = await fetch(url, options);
      console.log("Fetch response status:", response.status);

      // Create a response-like object with async methods
      return {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        async json() {
          try {
            const text = await response.text();
            console.log("Response text:", text.slice(0, 100) + "...");
            return JSON.parse(text);
          } catch (e) {
            console.error("JSON parse error:", e);
            throw e;
          }
        },
        async text() {
          return response.text();
        },
      };
    } catch (e) {
      console.error("Fetch error:", e);
      throw e;
    }
  };

  return {
    console,
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    Math,
    Date,
    JSON,
    String,
    Number,
    Boolean,
    Array,
    Object,
    Error,
    Promise,
    RegExp,
    fetch: wrappedFetch,
    // Add any other globals you want to expose
    ...context,
  };
}

export const runtimeContext = createRuntimeContext({
  // Add any custom context here
});
