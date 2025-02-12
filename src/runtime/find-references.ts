// @ts-ignore
import * as babel from "@babel/standalone";
import { trackDependencies } from "./dependency-tracker";

export async function transform(
  code: string,
  globals: Set<string>,
  cellId: string,
): Promise<{
  code: string;
  references: { name: string; dependencies: number; sourceCell: string }[];
}> {
  const dependencies = new Map<string, number>();

  const _code = `(async function() {
    ${code}
  })()`;

  const transformedCode = await babel.transform(_code, {
    filename: `cell-${cellId}.ts`,
    plugins: [trackDependencies(globals, dependencies)],
    presets: [["typescript", { isTSX: true, allExtensions: true }]],
    parserOpts: {
      plugins: ["typescript", "jsx"],
    },
  });

  return {
    code: transformedCode.code,
    references: Array.from(dependencies.entries()).map(
      ([name, dependencies]) => ({
        name,
        dependencies,
        sourceCell: cellId,
      }),
    ),
  };
}
