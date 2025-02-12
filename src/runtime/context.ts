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
    ...context,
  };
}

const StdLib = {
  fetch,
  sleep: (ms: number) => new Promise((resolve) => setTimeout(resolve, ms)),
  log: (...args: any[]) => console.log(...args),
  error: (...args: any[]) => console.error(...args),
  warn: (...args: any[]) => console.warn(...args),
  info: (...args: any[]) => console.info(...args),
  debug: (...args: any[]) => console.debug(...args),
  trace: (...args: any[]) => console.trace(...args),
  now: () => Date.now(),
  time: (label: string) => console.time(label),
  timeEnd: (label: string) => console.timeEnd(label),
  range: (start: number, end: number) =>
    Array.from({ length: end - start }, (_, i) => start + i),
  shuffle: <T>(array: T[]): T[] => {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  },

  uuid: () => crypto.randomUUID(),
  base64: {
    encode: (str: string) => btoa(str),
    decode: (str: string) => atob(str),
  },

  random: {
    int: (min: number, max: number) =>
      Math.floor(Math.random() * (max - min + 1)) + min,
    float: (min: number, max: number) => Math.random() * (max - min) + min,
  },
};

export const runtimeContext = createRuntimeContext(StdLib);
