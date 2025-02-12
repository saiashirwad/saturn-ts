export function createRuntimeContext(context: Record<string, any>) {
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
    // Add any other globals you want to expose
    ...context,
  };
}

export const runtimeContext = createRuntimeContext({
  // Add any custom context here
});
