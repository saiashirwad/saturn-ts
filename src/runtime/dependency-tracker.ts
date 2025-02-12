import { PluginObj } from "@babel/core";
import { ObjectProperty } from "@babel/types";

export function trackDependencies(
  globalReactiveVariables: Set<string>,
  dependencies: Map<string, number>,
) {
  return (): PluginObj => {
    return {
      visitor: {
        Program: {
          enter(path) {
            // Track exported variables from return statements
            const exportedVars = new Set<string>();

            path.traverse({
              ReturnStatement(path) {
                const argument = path.node.argument;
                if (argument && argument.type === "ObjectExpression") {
                  // Extract keys from object literal return statement
                  argument.properties.forEach((prop) => {
                    if (
                      prop.type === "ObjectProperty" &&
                      prop.key.type === "Identifier"
                    ) {
                      exportedVars.add(prop.key.name);
                    }
                  });
                }
              },
            });

            // Track usage of global reactive variables
            path.traverse({
              Identifier(path) {
                const name = path.node.name;
                if (
                  globalReactiveVariables.has(name) &&
                  !exportedVars.has(name)
                ) {
                  // Don't track the variable if it's being declared
                  const binding = path.scope.getBinding(name);
                  if (!binding || binding.scope.block !== path.scope.block) {
                    const currentDependencies = dependencies.get(name) || 0;
                    dependencies.set(name, currentDependencies + 1);
                  }
                }
              },
            });
          },
          exit() {
            return { dependencies };
          },
        },
      },
    };
  };
}
