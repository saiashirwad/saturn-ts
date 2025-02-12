import { PluginObj, NodePath, types as BabelTypes } from "@babel/core";
import type * as BabelCoreTypes from "@babel/core";

export interface Dependencies {
  [key: string]: Set<string>;
}

type Metadata = {
  reactiveVariables: Set<string>;
  dependencies: Dependencies;
};

export function trackDependencies(
  reactiveVariables: Set<string>,
  dependencies: Dependencies,
) {
  return ({ types: t }: { types: typeof BabelTypes }): PluginObj => {
    return {
      visitor: {
        Program(path) {
          path.traverse({
            VariableDeclarator(path) {
              const init = path.node.init;
              if (
                init &&
                t.isCallExpression(init) &&
                t.isIdentifier(init.callee) &&
                init.callee.name === "$" &&
                t.isIdentifier(path.node.id)
              ) {
                reactiveVariables.add(path.node.id.name);
              }
            },
          });

          path.traverse({
            Identifier(path) {
              if (reactiveVariables.has(path.node.name)) {
                const parentFunction = path.findParent(
                  (
                    p,
                  ): p is BabelCoreTypes.NodePath<BabelCoreTypes.types.Function> =>
                    t.isFunctionDeclaration(p.node) ||
                    t.isArrowFunctionExpression(p.node),
                );

                if (parentFunction && parentFunction.node) {
                  let functionName = "anonymous";
                  if (
                    t.isFunctionDeclaration(parentFunction.node) &&
                    parentFunction.node.id
                  ) {
                    functionName = parentFunction.node.id.name;
                  }

                  dependencies[functionName] =
                    dependencies[functionName] || new Set();
                  dependencies[functionName].add(path.node.name);
                }
              }
            },
          });

          // Code transformation for reactivity
          path.traverse({
            VariableDeclarator(path) {
              const init = path.node.init;
              if (
                init &&
                t.isCallExpression(init) &&
                t.isIdentifier(init.callee) &&
                init.callee.name === "$"
              ) {
                path.node.init = t.callExpression(t.identifier("reactive"), [
                  ...(t.isCallExpression(init) ? init.arguments : []),
                ]);
              }
            },
            FunctionDeclaration(path) {
              const functionName = path.node.id?.name || "anonymous";
              if (dependencies[functionName]) {
                // Register dependent functions
                path.node.body.body.unshift(
                  t.expressionStatement(
                    t.callExpression(t.identifier("registerFunction"), [
                      t.stringLiteral(functionName),
                      t.arrayExpression(
                        Array.from(dependencies[functionName]).map((varName) =>
                          t.stringLiteral(varName),
                        ),
                      ),
                    ]),
                  ),
                );
              }
            },
          });
        },
      },
    };
  };
}
