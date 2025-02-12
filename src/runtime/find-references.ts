// @ts-ignore
import * as babel from "@babel/standalone";
import { trackDependencies } from "./dependency-tracker";

export async function findReferences(
  code: string,
  globals: Set<string>,
  cellId: string,
) {
  const dependencies = new Map<string, number>();

  const _code = `(async function() {
    ${code}
  })()`;

  await babel.transform(_code, {
    filename: `cell-${cellId}.ts`,
    plugins: [trackDependencies(globals, dependencies)],
    presets: ["typescript"],
    parserOpts: {
      plugins: ["typescript", "jsx"],
    },
  });

  return Array.from(dependencies.entries()).map(([name, dependencies]) => ({
    name,
    dependencies,
    sourceCell: cellId,
  }));
}
