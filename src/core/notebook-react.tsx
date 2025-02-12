import React, { useEffect, useRef } from "react";
import {
  Cell,
  NotebookOptions,
  NotebookState,
  Notebook as VanillaNotebook,
} from "./notebook-vanilla";
import { Observable, observable } from "@legendapp/state";

interface NotebookProps {
  className?: string;
  initialState?: Partial<NotebookState>;
  state$?: Observable<NotebookState>;
}

// Export a type for the ref handle
export interface NotebookHandle {
  addCell: (aboveId?: string) => string | undefined;
  deleteCell: (id: string) => void;
  executeCell: (id: string) => Promise<void>;
  getState: () => NotebookState;
  getStateObservable: () => Observable<NotebookState>;
}

const NotebookComponent = React.forwardRef<NotebookHandle, NotebookProps>(
  ({ className, initialState, state$ }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const notebookRef = useRef<VanillaNotebook | null>(null);

    useEffect(() => {
      if (!containerRef.current) return;

      // Initialize notebook with provided or new state observable
      const notebook = new VanillaNotebook({
        state$:
          state$ ||
          observable<NotebookState>({
            cells: initialState?.cells || [],
            focusedCellId: initialState?.focusedCellId || null,
            globals: initialState?.globals || {},
          }),
      });

      // Mount notebook
      const cleanup = notebook.mount(containerRef.current);
      notebookRef.current = notebook;

      return () => {
        cleanup();
        notebookRef.current = null;
      };
    }, []); // Empty deps array since we want to initialize only once

    // Expose notebook methods via a ref
    React.useImperativeHandle(
      ref,
      () => ({
        addCell: (aboveId?: string) => notebookRef.current?.addCell(aboveId),
        deleteCell: (id: string) => {
          notebookRef.current?.deleteCell(id);
        },
        executeCell: async (id: string) => {
          await notebookRef.current?.executeCell(id);
        },
        getState: () => notebookRef.current?.getState() as NotebookState,
        getStateObservable: () =>
          notebookRef.current?.getStateObservable() as Observable<NotebookState>,
      }),
      [],
    );

    return (
      <div
        ref={containerRef}
        className={className}
        style={{ width: "100%", height: "100%" }}
      />
    );
  },
);

// Example usage:
/*
import { NotebookComponent, NotebookHandle } from './notebook-react';
import { observable } from '@legendapp/state';

const MyNotebookWrapper = () => {
  const notebookRef = useRef<NotebookHandle>(null);
  
  // Optional: Create and manage state externally
  const state$ = observable<NotebookState>({
    cells: [],
    focusedCellId: null,
    globals: {},
  });

  // Subscribe to state changes
  useEffect(() => {
    const unsub = state$.onChange((state) => {
      console.log('Notebook state:', state);
    });
    return () => unsub();
  }, []);

  const handleAddCell = () => {
    notebookRef.current?.addCell();
  };

  return (
    <div>
      <button onClick={handleAddCell}>Add Cell</button>
      <NotebookComponent
        ref={notebookRef}
        className="my-notebook"
        state$={state$} // Optional: Pass external state
        initialState={{ // Only used if state$ is not provided
          cells: [
            { id: '1', type: 'code', content: 'console.log("Hello World!")' }
          ]
        }}
      />
    </div>
  );
};
*/

export { NotebookComponent as Notebook };
