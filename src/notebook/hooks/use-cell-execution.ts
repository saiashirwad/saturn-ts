import { useCallback } from "react";
// @ts-ignore
import { parse } from "sucrase/dist/parser";
// @ts-ignore
import { TokenType as tt } from "sucrase/dist/parser/tokenizer/types";
import { JavaScriptExecutor } from "../../runtime/js-executor";
import { hashCode } from "../../utils/hash";
import { notebook$, updateCell, updateCellAnalysis } from "../notebook-store";

console.log(parse);

function findReferences(
  code: string,
  globals: Array<{ name: string }>,
  cellId: string,
) {
  const references = new Map<string, number>();
  const globalNames = new Set(globals.map((g) => g.name));

  console.log("Finding references for globals:", Array.from(globalNames));

  try {
    // Parse the code into an AST
    console.log("Attempting to parse code:", code);
    const ast = parse(code, true, true, false);
    console.log("AST parsed successfully");

    // Walk through the tokens and track identifier usage
    for (const token of ast.tokens) {
      if (token.type === tt.name && globalNames.has(token.value)) {
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
      console.log(`Executing cell ${cellId} with code:`, code);
      try {
        const executor = new JavaScriptExecutor();
        const globals = notebook$.globals.get();
        console.log("Current globals:", globals);

        const globalScope = Object.fromEntries(
          globals.map(({ name, value }) => [name, value]),
        );
        console.log("Constructed global scope:", globalScope);

        // Find references before execution, now passing cellId
        const references = findReferences(code, globals, cellId);
        console.log("Found references:", references);

        // Execute with globals injected into scope
        console.log("Executing code with global scope...");
        const result = await executor.execute(code, globalScope);
        console.log("Execution result:", result);

        const newHash = hashCode(code);

        if (result.result && typeof result.result === "object") {
          console.log("Processing object result:", result.result);
          const exports = Object.entries(result.result).map(
            ([name, value]) => ({
              name,
              value,
              type: typeof value,
            }),
          );
          console.log("Processed exports:", exports);

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
        console.error("Cell execution failed:", error);
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
