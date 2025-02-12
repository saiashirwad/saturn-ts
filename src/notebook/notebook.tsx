import { use$ } from "@legendapp/state/react";
import * as React from "react";
import { CommandPalette } from "../command/command-palette";
import { useKeyboardNav } from "../keyboard/use-keyboard-nav";
import { addCell, notebook$ } from "./notebook-store";
import { RenderCodeCell } from "./render-code-cell";

export function Notebook() {
  return (
    <div
      className="min-h-screen bg-background text-foreground"
      role="main"
      aria-label="Notebook editor"
    >
      <CommandPalette />
      <TopBar />
      <Editor />
    </div>
  );
}

function TopBar() {
  return (
    <div className="flex items-center justify-between px-2 py-1 border-b border-border"></div>
  );
}

function Editor() {
  const cells = use$(notebook$.cells);
  const focusedCellId = use$(notebook$.focusedCellId);
  const cellRefs = React.useRef<Map<string, HTMLDivElement>>(new Map());

  useKeyboardNav();

  return (
    <div
      className="flex flex-col w-full"
      role="list"
      aria-label="Notebook cells"
    >
      {cells.map((cell, index) => (
        <div key={cell.id} role="listitem">
          {cell.type === "code" ? (
            <RenderCodeCell
              ref={(el) => {
                if (el) {
                  cellRefs.current.set(cell.id, el);
                }
              }}
              cell={cell}
              isFocused={focusedCellId === cell.id}
            />
          ) : null}
        </div>
      ))}
    </div>
  );
}
