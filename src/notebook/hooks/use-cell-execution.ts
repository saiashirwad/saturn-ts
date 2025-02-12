import { useCallback } from "react";
import { hashCode } from "../../utils/hash";
import { notebook$, updateCell, updateCellAnalysis } from "../notebook-store";
import { runCode } from "../../runtime/run-code";

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
