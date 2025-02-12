import { use$ } from "@legendapp/state/react";
import { Variable } from "lucide-react";
import * as React from "react";
import { CommandPalette } from "../command/command-palette";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "../components/ui/resizable";
import { useKeyboardNav } from "../keyboard/use-keyboard-nav";
import { RenderCodeCell } from "./render-code-cell";
import { notebook$ } from "./notebook-store";

export function Notebook() {
  return (
    <div
      className="h-screen flex flex-col bg-background text-foreground"
      role="main"
      aria-label="Notebook editor"
    >
      <CommandPalette />
      <TopBar />
      <div className="flex-1">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          <ResizablePanel defaultSize={75} minSize={30}>
            <Editor />
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={25} minSize={20}>
            <GlobalsPanel />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
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

function GlobalsPanel() {
  const globals = use$(notebook$.globals);

  return (
    <div className="h-full flex flex-col border-l border-border">
      <div className="p-4 border-b border-border">
        <h2 className="text-sm font-semibold">Global Variables</h2>
      </div>
      <div className="flex-1 overflow-auto p-2">
        {globals.length === 0 ? (
          <div className="text-sm text-muted-foreground p-2">
            No global variables defined
          </div>
        ) : (
          <div className="space-y-2">
            {globals.map(({ name, value, type, sourceCell }) => (
              <div
                key={`${sourceCell}-${name}`}
                className="flex items-center gap-2 p-2 rounded-md hover:bg-muted"
              >
                <Variable className="w-4 h-4 text-blue-500" />
                <span className="font-mono text-sm">{name}</span>
                <span className="text-xs text-muted-foreground ml-auto">
                  {type}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
