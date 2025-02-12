import { JavaScriptExecutor } from "./js-executor";
import { findReferences } from "./find-references";

export async function runCode(
  code: string,
  globals: Array<{ name: string; value: any }>,
  onLog: (log: string) => void,
) {
  const executor = new JavaScriptExecutor({ onLog });

  const result = await executor.execute(code, globals);
  const references =
    (await findReferences(code, new Set(globals.map((g) => g.name)), "")) || [];
  console.log(references);

  const exports =
    result.result && typeof result.result === "object"
      ? Object.entries(result.result).map(([name, value]) => ({
          name,
          value,
          type: typeof value,
        }))
      : [];

  return {
    result: result.result,
    logs: result.logs,
    exports,
    references,
  };
}
