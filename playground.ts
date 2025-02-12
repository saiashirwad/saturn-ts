import * as babel from "@babel/core";
import { trackDependencies } from "./src/runtime/dependency-tracker";

const code = `
  const doubled = count * 2;
  const something = rip * 2

  type A = string

  function display() {
    console.log(doubled);
    console.log(something);
    console.log(count);
  }
`;

const reactiveVariables = new Set<string>(["count", "rip"]);
const dependencies = new Map<string, number>();

const transformedCode = await babel.transformAsync(code, {
  filename: "playground.ts",
  plugins: [trackDependencies(reactiveVariables, dependencies)],
  presets: ["@babel/preset-typescript"],
  parserOpts: {
    plugins: ["typescript", "jsx"],
  },
});

console.log(dependencies);
console.log(transformedCode?.code);
