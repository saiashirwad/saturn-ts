import { useCallback } from "react";
import { JavaScriptExecutor } from "../../runtime/js-executor";
import { hashCode } from "../../utils/hash";
import { updateCell, updateCellAnalysis } from "../notebook-store";

export function useCellExecution(cellId: string) {
  return useCallback(
    async (code: string) => {
      try {
        const executor = new JavaScriptExecutor();
        const result = await executor.execute(code);

        const newHash = hashCode(code);

        updateCell(cellId, {
          content: code,
          hash: newHash,
          output: {
            logs: result.logs,
            result: result.result,
          },
          error: null,
        });

        if (result.result && typeof result.result === "object") {
          updateCellAnalysis(cellId, {
            exports: Object.entries(result.result).map(([name, value]) => ({
              name,
              value,
              type: typeof value,
            })),
            references: [], // TODO: Parse code to find references
          });
        }
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
