import { ReactNode } from "react";

type Pattern<T, Output> = {
  when: T;
  then: (value: T) => Output;
};

function pattern<T, Output>(p: Pattern<T, Output>): Pattern<T, Output> {
  return p;
}

type MatchProps<T> = {
  value: T;
  patterns: Pattern<T, ReactNode>[];
  fallback?: (value: T) => ReactNode;
};

type Shape =
  | { kind: "square"; side: number }
  | { kind: "rectangle"; size: "big" | "small"; width: number; height: number }
  | { kind: "circle"; radius: number };

type bigRectangle = {
  kind: "rectangle";
  size: "big";
  width: 0;
  height: number;
};

// type Difference<A, B> = {
//   [K in A extends unknown ? keyof A : never]: K extends keyof B
//     ? A[K] extends string | number | boolean | any[]
//       ? A[K]
//       : Exclude<A[K], B[K]>
//     : A[K];
// };

// type result = Difference<Shape, bigRectangle>;

type DI<T> = {
  [K in T extends unknown ? keyof T : never]: T extends { [_ in K]: infer V }
    ? V
    : never;
};

// function ShapeRenderer({ shape }: { shape: Shape }) {
//   return (
//     <Match
//       value={shape}
//       discriminator="kind"
//       patterns={[
//         pattern({
//           when: { kind: "square", side: 0 } as const,
//           then: (shape) => <div>Square with side {shape.side}</div>,
//         }),
//         pattern({
//           when: { kind: "rectangle", width: 0, height: 0 } as const,
//           then: (shape) => (
//             <div>
//               Rectangle {shape.width}x{shape.height}
//             </div>
//           ),
//         }),
//       ]}
//       fallback={(shape) => {
//         // TypeScript knows this is the circle case!
//         if (shape.kind === "circle") {
//           return <div>Circle with radius {shape.radius}</div>
//         }
//         return null
//       }}
//     />
//   )
// }
