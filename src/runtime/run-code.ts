import type { Identifier, Module } from "@swc/core";
import { parseSync } from "@swc/wasm-web";
import { JavaScriptExecutor } from "./js-executor";

async function findReferences(
  code: string,
  globals: Array<{ name: string; value: any }>,
  cellId: string,
) {
  const _code = `(async () => {
    ${code}
  })();`;
  const references = new Map<string, number>();

  try {
    const ast = parseSync(_code, {
      syntax: "typescript",
      tsx: true,
    }) as Module;

    const visitIdentifier = (node: Identifier) => {
      if (globals.find((g) => g.name === node.value)) {
        const count = references.get(node.value) || 0;
        references.set(node.value, count + 1);
      }
    };

    const traverse = (node: any) => {
      if (!node || typeof node !== "object") return;

      if (node.type === "Identifier") {
        visitIdentifier(node as Identifier);
      }

      for (const key in node) {
        if (Array.isArray(node[key])) {
          node[key].forEach(traverse);
        } else if (typeof node[key] === "object") {
          traverse(node[key]);
        }
      }
    };

    traverse(ast);

    return Array.from(references.entries()).map(([name, count]) => ({
      name,
      count,
      sourceCell: cellId,
    }));
  } catch (error) {
    console.error("Failed to parse code:", error);
    return;
  }
}

function wrapCode(code: string, globals: Array<{ name: string; value: any }>) {
  return `
    (async () => {
      // GLOBAL_BEGIN
      ${globals
        .map(({ name, value }) => `const ${name} = ${JSON.stringify(value)};`)
        .join("\n")}
      // GLOBAL_END
      ${code}
    })();
  `;
}

export async function runCode(
  code: string,
  globals: Array<{ name: string; value: any }>,
) {
  const executor = new JavaScriptExecutor();

  const result = await executor.execute(code, globals);
  const references = (await findReferences(code, globals, "")) || [];

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
