// src/runtime/babel/signal-transform.ts
import { PluginObj, types as t } from "@babel/core";

export function signalTransformPlugin(): PluginObj {
  return {
    name: "transform-signal-declarations",
    visitor: {
      // Handle variable declarations like: const count = $(5)
      VariableDeclarator(path) {
        const init = path.get("init");
        if (!init.isCallExpression()) return;

        const callee = init.get("callee");
        if (!callee.isIdentifier({ name: "$" })) return;

        if (!t.isIdentifier(path.node.id)) return;
        const varName = path.node.id.name;

        // Transform $(value) into $create(value, 'varName')
        init.replaceWith(
          t.callExpression(t.identifier("$create"), [
            ...init.node.arguments,
            t.stringLiteral(varName),
          ]),
        );
      },

      // Handle signal access like: console.log($.count)
      MemberExpression(path) {
        const object = path.get("object");
        if (!object.isIdentifier({ name: "$" })) return;

        const property = path.node.property;
        if (!t.isIdentifier(property)) return;

        // Transform $.count into $get('count')
        path.replaceWith(
          t.callExpression(t.identifier("$get"), [
            t.stringLiteral(property.name),
          ]),
        );
      },
    },
  };
}

// Updated signal runtime implementation
export class SignalStore {
  private signals = new Map<string, any>();

  create<T>(value: T, name: string): T {
    if (this.signals.has(name)) {
      throw new Error(`Signal "${name}" already exists`);
    }

    const signal = {
      value,
      subscribers: new Set<() => void>(),
    };

    this.signals.set(name, signal);
    return value;
  }

  get(name: string) {
    const signal = this.signals.get(name);
    if (!signal) {
      throw new Error(`Signal "${name}" not found`);
    }
    return signal.value;
  }

  set(name: string, value: any) {
    const signal = this.signals.get(name);
    if (!signal) {
      throw new Error(`Signal "${name}" not found`);
    }
    signal.value = value;
    signal.subscribers.forEach((sub: () => void) => sub());
  }

  subscribe(name: string, callback: () => void) {
    const signal = this.signals.get(name);
    if (signal) {
      signal.subscribers.add(callback);
      return () => signal.subscribers.delete(callback);
    }
    return () => {};
  }
}

export const signalStore = new SignalStore();

// Runtime helper functions that the transformed code will use
export const $create = (value: any, name: string) =>
  signalStore.create(value, name);
export const $get = (name: string) => signalStore.get(name);
export const $set = (name: string, value: any) => signalStore.set(name, value);

// The $ function that gets imported in cells
export function $(value: any) {
  // This will be transformed by the Babel plugin
  return value;
}

// Create the proxy for accessing signals
export const $signals = new Proxy(
  {},
  {
    get(_, prop: string) {
      return signalStore.get(prop);
    },
    set(_, prop: string, value) {
      signalStore.set(prop, value);
      return true;
    },
  },
);
