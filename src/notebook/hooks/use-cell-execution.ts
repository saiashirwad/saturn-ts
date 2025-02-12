import { useCallback } from "react";
// @ts-ignore
import { TokenType as tt } from "sucrase/dist/parser/tokenizer/types";
import { JavaScriptExecutor } from "../../runtime/js-executor";
import { hashCode } from "../../utils/hash";
import { notebook$, updateCell, updateCellAnalysis } from "../notebook-store";
import { parseSync } from "@swc/wasm-web";
import type { Identifier, Module } from "@swc/core";

async function findReferences(
  code: string,
  globals: Array<{ name: string }>,
  cellId: string,
) {
  const references = new Map<string, number>();
  const globalNames = new Set(globals.map((g) => g.name));

  try {
    const ast = parseSync(code, {
      syntax: "typescript",
      tsx: true,
    }) as Module;

    const visitIdentifier = (node: Identifier) => {
      if (globalNames.has(node.value)) {
        const count = references.get(node.value) || 0;
        references.set(node.value, count + 1);
      }
    };

    // Traverse the AST manually since we don't have access to @swc/core traverse
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

async function runCode(
  code: string,
  globals: Array<{ name: string; value: any }>,
) {
  const executor = new JavaScriptExecutor();
  const globalScope = Object.fromEntries(
    globals.map(({ name, value }) => [name, value]),
  );

  const result = await executor.execute(code, globalScope);
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

export function useCellExecution(cellId: string) {
  return useCallback(
    async (code: string) => {
      try {
        const globals = notebook$.globals.get();
        const newHash = hashCode(code);

        const result = await runCode(code, globals);

        updateCell(cellId, {
          content: code,
          hash: newHash,
          output: {
            logs: result.logs,
            result: result.result,
          },
          error: null,
        });

        updateCellAnalysis(cellId, {
          exports: result.exports,
          references: result.references,
        });
      } catch (error) {
        const newHash = hashCode(code);
        updateCell(cellId, {
          content: code,
          hash: newHash,
          error: error instanceof Error ? error.message : String(error),
          output: null,
        });
        updateCellAnalysis(cellId, {
          exports: [],
          references: [],
        });
      }
    },
    [cellId],
  );
}
