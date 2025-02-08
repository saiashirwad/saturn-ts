import { Matcher } from "./utils/matcher"

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

export function Playground() {
  return (
    <div>
      <MatchShape shape={{ type: "circle", kind: "circle", radius: 2 }} />
    </div>
  )
}
