import * as babel from "@babel/core";
import { trackDependencies } from "./src/runtime/dependency-tracker";

const code = `
  const doubled = count * 2;
  const something = rip * 2

  function display() {
    console.log(doubled);
    console.log(something);
    console.log(count);
  }
`;

const reactiveVariables = new Set<string>(["count", "rip"]);
const dependencies = new Map<string, number>();

const transformedCode = await babel.transformAsync(code, {
  plugins: [trackDependencies(reactiveVariables, dependencies)],
});

console.log(dependencies);
