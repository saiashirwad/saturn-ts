import { Matcher } from "./utils/matcher"
import { match, P } from "ts-pattern"

type Shape =
  | { type: "rectangle"; kind: "rectangle"; length: number; width: number }
  | { type: "square"; kind: "square"; side: number }
  | { type: "circle"; kind: "circle"; radius: number }

function lol(shape: Shape) {
  const result = match(shape)
    .with({ length: P.number }, (s) => "hi")
    .otherwise((s) => {})
}

export function Playground() {
  return <div></div>
}
