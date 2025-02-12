type Matchable = { type: string };

type UnionToTuple<T, Acc extends any[] = []> = [T] extends [never]
  ? Acc
  : T extends any
    ? UnionToTuple<Exclude<T, T>, [T, ...Acc]>
    : never;

type IsExhaustive<
  T extends Matchable,
  R extends Partial<Record<T["type"], any>>,
> = UnionToTuple<T["type"]> extends (keyof R)[] ? true : false;

type Exhaustive<T extends Matchable, Output> = {
  [k in T["type"]]: (props: Extract<T, { type: k }>) => Output;
};
