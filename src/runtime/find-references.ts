import type { Module, Identifier } from "@swc/core";
import { parseSync } from "@swc/wasm-web";

export async function findReferences(
  code: string,
  globals: Array<{ name: string; value: any }>,
  cellId: string,
) {
  const _code = `(async () => {
    ${code}
  })();`;
  const references = new Map<string, number>();

  // TODO: fix this
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
