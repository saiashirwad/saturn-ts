import { useCallback } from "react";
// @ts-ignore
import { parse } from "sucrase/dist/parser";
// @ts-ignore
import { TokenType as tt } from "sucrase/dist/parser/tokenizer/types";
import { JavaScriptExecutor } from "../../runtime/js-executor";
import { hashCode } from "../../utils/hash";
import { notebook$, updateCell, updateCellAnalysis } from "../notebook-store";

function findReferences(
  code: string,
  globals: Array<{ name: string }>,
  cellId: string,
) {
  const references = new Map<string, number>();
  const globalNames = new Set(globals.map((g) => g.name));

  try {
    const ast = parse(code, true, true, false);

    for (const token of ast.tokens) {
      if (token.type === tt.name && globalNames.has(token.value)) {
        console.log(token);
        console.log("Found reference to global:", token.value);
        // Skip if this is a declaration
        const nextToken = ast.tokens[ast.tokens.indexOf(token) + 1];
        if (nextToken && nextToken.type === tt.eq) continue;

        // Count the reference
        const count = references.get(token.value) || 0;
        references.set(token.value, count + 1);
      }
    }

    return Array.from(references.entries()).map(([name, count]) => ({
      name,
      count,
      sourceCell: cellId,
    }));
  } catch (error) {
    console.warn("AST parsing failed:", error);
    // Fallback to simple regex matching if parsing fails
    const pattern = new RegExp(
      `\\b(${Array.from(globalNames).join("|")})\\b`,
      "g",
    );
    const matches = code.match(pattern) || [];

    matches.forEach((match) => {
      const count = references.get(match) || 0;
      references.set(match, count + 1);
    });

    return Array.from(references.entries()).map(([name, count]) => ({
      name,
      count,
      sourceCell: cellId,
    }));
  }
}

export function useCellExecution(cellId: string) {
  return useCallback(
    async (code: string) => {
      try {
        const executor = new JavaScriptExecutor();
        const globals = notebook$.globals.get();

        const globalScope = Object.fromEntries(
          globals.map(({ name, value }) => [name, value]),
        );

        // Find references before execution, now passing cellId
        const references = findReferences(code, globals, cellId);

        // Execute with globals injected into scope
        const result = await executor.execute(code, globalScope);

        const newHash = hashCode(code);

        if (result.result && typeof result.result === "object") {
          const exports = Object.entries(result.result).map(
            ([name, value]) => ({
              name,
              value,
              type: typeof value,
            }),
          );

          updateCellAnalysis(cellId, {
            exports,
            references,
          });
        }

        updateCell(cellId, {
          content: code,
          hash: newHash,
          output: {
            logs: result.logs,
            result: result.result,
          },
          error: null,
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
