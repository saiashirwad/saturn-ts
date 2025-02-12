interface SignalValue<T> {
  value: T;
  dependencies: Set<string>;
  subscribers: Set<(value: T) => void>;
}

class SignalStore {
  private signals: Map<string, SignalValue<any>> = new Map();
  private currentCell: string | null = null;

  createSignal<T>(value: T, name?: string): T {
    const signalName = name || `signal_${Math.random().toString(36).slice(2)}`;

    if (this.signals.has(signalName)) {
      throw new Error(`Signal "${signalName}" already exists`);
    }

    this.signals.set(signalName, {
      value,
      dependencies: new Set(),
      subscribers: new Set(),
    });

    // Create a proxy to track access
    return new Proxy({} as any, {
      get: (_, prop) => {
        if (prop === "value") {
          // Track dependency if we're in a cell context
          if (this.currentCell) {
            const signal = this.signals.get(signalName)!;
            signal.dependencies.add(this.currentCell);
          }
          return this.signals.get(signalName)!.value;
        }
      },
      set: (_, prop, newValue) => {
        if (prop === "value") {
          const signal = this.signals.get(signalName)!;
          signal.value = newValue;
          // Notify subscribers
          signal.subscribers.forEach((subscriber) => subscriber(newValue));
          return true;
        }
        return false;
      },
    });
  }

  // Access signals via $
  get $() {
    return new Proxy(
      {},
      {
        get: (_, prop: string) => {
          const signal = this.signals.get(prop);
          if (!signal) {
            throw new Error(`Signal "${prop}" not found`);
          }

          // Track dependency if we're in a cell context
          if (this.currentCell) {
            signal.dependencies.add(this.currentCell);
          }

          return signal.value;
        },
      },
    );
  }

  // Set the current cell context
  setCurrentCell(cellId: string | null) {
    this.currentCell = cellId;
  }

  // Subscribe to changes
  subscribe(name: string, callback: (value: any) => void) {
    const signal = this.signals.get(name);
    if (signal) {
      signal.subscribers.add(callback);
      return () => signal.subscribers.delete(callback);
    }
    return () => {};
  }

  // Get dependencies for a cell
  getDependencies(cellId: string): string[] {
    const deps = new Set<string>();
    for (const [name, signal] of this.signals.entries()) {
      if (signal.dependencies.has(cellId)) {
        deps.add(name);
      }
    }
    return Array.from(deps);
  }

  // Clear cell dependencies
  clearCellDependencies(cellId: string) {
    for (const signal of this.signals.values()) {
      signal.dependencies.delete(cellId);
    }
  }
}

export const signalStore = new SignalStore();

export function $(value: any, name?: string) {
  return signalStore.createSignal(value, name);
}
