import { PluginObj } from "@babel/core";

interface PluginMetadata {
  plugins?: Array<{
    dependencies?: Set<string>;
  }>;
}

export function trackDependencies(
  globalReactiveVariables: Set<string>,
  dependencies: Map<string, number>,
) {
  return (): PluginObj => {
    return {
      visitor: {
        Program: {
          enter(path) {
            // Track usage of global reactive variables
            path.traverse({
              Identifier(path) {
                if (globalReactiveVariables.has(path.node.name)) {
                  // Don't track the variable if it's being declared
                  const binding = path.scope.getBinding(path.node.name);
                  if (!binding || binding.scope.block !== path.scope.block) {
                    const currentDependencies =
                      dependencies.get(path.node.name) || 0;
                    dependencies.set(path.node.name, currentDependencies + 1);
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
