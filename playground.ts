import * as babel from "@babel/core";
import {
  Dependencies,
  trackDependencies,
} from "./src/runtime/dependency-tracker";

const code = `
  const count = $(0);
  const doubled = $(() => count() * 2);

  function display() {
    console.log(doubled());
  }
  display();
`;

const reactiveVariables = new Set<string>();
const dependencies: Dependencies = {};

const transformedCode = babel.transformSync(code, {
  plugins: [trackDependencies(reactiveVariables, dependencies)],
});

console.log(dependencies);
console.log(reactiveVariables);
