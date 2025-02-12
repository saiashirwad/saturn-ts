import { Component, createSignal, onCleanup, onMount } from "solid-js";
import type { Accessor, Setter } from "solid-js";
import { Notebook } from "./notebook-core";

export interface Cell {
  id: string;
  type: "code";
  content: string;
  output?: {
    result: any;
    logs: string[];
  };
  error?: string;
  analysis?: {
    exports: Array<{ name: string; value: any; type: string }>;
    references: Array<{ name: string; count: number }>;
  };
}

export interface NotebookState {
  cells: Cell[];
  focusedCellId: string | null;
  globals: Record<string, any>;
}

interface NotebookProps {
  class?: string;
  state: Accessor<NotebookState>;
  setState: Setter<NotebookState>;
}

export const NotebookComponent: Component<NotebookProps> = (props) => {
  const [ref, setRef] = createSignal<HTMLDivElement>();
  let notebookInstance: Notebook | undefined;

  onMount(() => {
    const container = ref();
    if (!container) return;

    const notebook = new Notebook({
      initialState: props.state(),
      onChange: (newState) => {
        props.setState(() => newState);
      },
    });

    const cleanup = notebook.mount(container);
    notebookInstance = notebook;

    onCleanup(() => {
      cleanup();
      notebookInstance = undefined;
    });
  });

  return (
    <div
      ref={setRef}
      class={props.class}
      style={{ width: "100%", height: "100%" }}
    />
  );
};
