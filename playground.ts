import * as babel from "@babel/core";
import { trackDependencies } from "./src/runtime/dependency-tracker";

const code = `
  const doubled = count * 2;
  const something = rip * 2

  function display() {
    console.log(doubled);
  }
`;

const reactiveVariables = new Set<string>(["count", "rip"]);
const dependencies = new Set<string>();

const transformedCode = babel.transformSync(code, {
  plugins: [trackDependencies(reactiveVariables, dependencies)],
});

console.log(reactiveVariables);
