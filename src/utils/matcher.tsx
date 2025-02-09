import * as React from "react"

type Pretty<T> = { [k in keyof T]: T[k] } & {}

type UnMatchedProps<
  Discriminator extends string,
  T extends Matchable<Discriminator>,
  R extends Partial<Matchable<Discriminator>>,
> = Extract<
  T,
  { [key in Discriminator]: Exclude<T[Discriminator], R[Discriminator]> }
>

type Matchable<Discriminator extends string> = {
  [key in Discriminator]: string
}

type Exhaustive<
  Discriminator extends string,
  T extends Matchable<Discriminator>,
  Output,
> = {
  [k in T[Discriminator]]: (
    props: Extract<T, { [key in Discriminator]: k }>,
  ) => Output
}

type InExhaustive<
  Discriminator extends string,
  T extends Matchable<Discriminator>,
  Output,
  P = Partial<{
    [k in T[Discriminator]]: (
      props: Extract<T, { [key in Discriminator]: k }>,
    ) => Output
  }>,
> = P & {
  _: (
    props: UnMatchedProps<
      Discriminator,
      T,
      { [K in keyof P]: Extract<T, { [key in Discriminator]: K }> }[keyof P]
    >,
  ) => Output
}

type MatcherProps<
  Discriminator extends string,
  T extends Matchable<Discriminator>,
  _ = { value: T; discriminator: Discriminator },
> = Pretty<
  | (_ & Exhaustive<Discriminator, T, React.ReactNode>)
  | (_ & InExhaustive<Discriminator, T, React.ReactNode>)
>

export function Matcher<
  Discriminator extends string,
  T extends Matchable<Discriminator>,
>({ value, ...matchers }: MatcherProps<Discriminator, T>): React.ReactNode {
  // @ts-ignore
  const handler = matchers[value.type as keyof typeof matchers] ?? matchers["_"]
  if (!handler) return null
  return (handler as (value: T) => React.ReactNode)(value)
}

type Shape =
  | { type: "rectangle"; kind: "rectangle"; length: number; width: number }
  | { type: "square"; kind: "square"; side: number }
  | { type: "circle"; kind: "circle"; radius: number }

function MatchShape(props: { shape: Shape }) {
  return (
    <div>
      <Matcher
        value={props.shape}
        discriminator="kind"
        square={({ side }) => <div>{JSON.stringify({ side }, null, 2)}</div>}
        rectangle={({ length, width }) => (
          <div>{JSON.stringify({ length, width }, null, 2)}</div>
        )}
        _={(props) => <pre>{JSON.stringify(props, null, 2)}</pre>}
      />
    </div>
  )
}
