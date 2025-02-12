import { Observable, observable } from "@legendapp/state";
import React, { useEffect, useRef } from "react";
import { NotebookState, Notebook as VanillaNotebook } from "./notebook-vanilla";

interface NotebookProps {
  className?: string;
  initialState?: Partial<NotebookState>;
  state$?: Observable<NotebookState>;
}

export const NotebookComponent = ({
  className,
  initialState,
  state$,
}: NotebookProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const notebookRef = useRef<VanillaNotebook | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const notebook = new VanillaNotebook({
      state$:
        state$ ||
        observable<NotebookState>({
          cells: initialState?.cells || [],
          focusedCellId: initialState?.focusedCellId || null,
          globals: initialState?.globals || {},
        }),
    });

    const cleanup = notebook.mount(containerRef.current);
    notebookRef.current = notebook;

    return () => {
      cleanup();
      notebookRef.current = null;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width: "100%", height: "100%" }}
    />
  );
};
