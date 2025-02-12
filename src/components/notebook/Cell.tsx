import { Component, createEffect } from "solid-js";
import { EditorView } from "@codemirror/view";
import { langs } from "@uiw/codemirror-extensions-langs";
import { githubDark } from "@uiw/codemirror-themes-all";
import type { Cell as CellType } from "../../core/notebook-core";

interface CellProps {
  cell: CellType;
  onExecute: (id: string) => void;
  onContentChange: (id: string, content: string) => void;
}

export const Cell: Component<CellProps> = (props) => {
  let editorRef: HTMLDivElement | undefined;
  let editorView: EditorView | undefined;

  createEffect(() => {
    if (!editorRef || editorView) return;

    editorView = new EditorView({
      doc: props.cell.content,
      extensions: [
        langs.typescript(),
        githubDark,
        EditorView.editable.of(true),
        EditorView.theme({
          "&": {
            fontSize: "14px",
            backgroundColor: "transparent",
            height: "auto",
            minHeight: "4rem",
          },
          ".cm-content": {
            fontFamily:
              "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
            padding: "1rem",
            minHeight: "4rem",
          },
          ".cm-line": { padding: "0 0.5rem" },
          ".cm-focused": { outline: "none" },
          "&.cm-editor": { backgroundColor: "transparent" },
          ".cm-gutters": {
            backgroundColor: "transparent",
            borderRight: "1px solid var(--border)",
            color: "var(--muted-foreground)",
          },
          ".cm-activeLineGutter": { backgroundColor: "transparent" },
        }),
        EditorView.lineWrapping,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            props.onContentChange(props.cell.id, update.state.doc.toString());
          }
        }),
      ],
      parent: editorRef,
    });

    return () => {
      editorView?.destroy();
      editorView = undefined;
    };
  });

  const renderOutput = () => {
    if (props.cell.error) {
      return (
        <div class="error-container" role="alert">
          {props.cell.error}
        </div>
      );
    }

    if (props.cell.output) {
      return (
        <div class="output-container">
          {props.cell.output.logs.length > 0 && (
            <div class="output-logs">
              {props.cell.output.logs.map((log) => (
                <div class="output-log-line">{log}</div>
              ))}
            </div>
          )}
          {props.cell.output.result !== undefined && (
            <div class="output-result">
              {typeof props.cell.output.result === "object"
                ? JSON.stringify(props.cell.output.result, null, 2)
                : String(props.cell.output.result)}
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div class="cell" role="region" aria-label={`Code cell ${props.cell.id}`}>
      <div class="cell-container" role="textbox" aria-label="Code editor">
        <div class="cell-editor-wrapper">
          <button
            class="execute-button"
            title="Run cell (Shift+Enter)"
            onClick={() => props.onExecute(props.cell.id)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="h-4 w-4"
            >
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </button>
          <div class="cell-editor" ref={editorRef} />
        </div>
        {renderOutput()}
      </div>
    </div>
  );
};
