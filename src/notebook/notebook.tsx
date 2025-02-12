import { For, observer, use$ } from "@legendapp/state/react";
import { Variable } from "lucide-react";
import * as React from "react";
import { CommandPalette } from "../command/command-palette";
import { useKeyboardNav } from "../keyboard/use-keyboard-nav";
import { useDarkMode } from "../utils/use-dark-mode";
import { CodeCell, notebook$ } from "./notebook-store";
import { RenderCodeCell } from "./render-code-cell";
import { ResizableHandle } from "../components/ui/resizable";
import { ResizablePanel } from "../components/ui/resizable";
import { ResizablePanelGroup } from "../components/ui/resizable";

const Notebook = React.memo(function Notebook() {
  return (
    <div
      className="h-screen flex flex-col bg-background text-foreground"
      role="main"
      aria-label="Notebook editor"
    >
      <CommandPalette />
      {/* <TopBar /> */}
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
      {/* <Editor /> */}
    </div>
  );
});

export { Notebook };

const TopBar = React.memo(function TopBar() {
  const { theme, toggleTheme } = useDarkMode();

  return (
    <div className="flex items-center justify-between px-2 py-1 border-b border-border">
      <button
        onClick={toggleTheme}
        className="px-3 py-1 rounded bg-secondary hover:bg-secondary/80"
      >
        {theme === "dark" ? "🌞" : "🌙"}
      </button>
    </div>
  );
});

const Editor = observer(function Editor() {
  useKeyboardNav();

  return (
    <div
      className="flex flex-col w-full"
      role="list"
      aria-label="Notebook cells"
    >
      <For each={notebook$.cells}>
        {(cell$) => {
          const cellId = cell$.id.get();

          return (
            <div key={cellId} role="listitem">
              {cell$.type.get() === "code" ? (
                <RenderCodeCell
                  cell={cell$.get() as CodeCell}
                  isFocused={notebook$.focusedCellId.get() === cellId}
                />
              ) : null}
            </div>
          );
        }}
      </For>
    </div>
  );
});

const GlobalsPanel = observer(() => {
  const globals = use$(notebook$.globals);
  const cells = use$(notebook$.cells);

  // Calculate total references for each global
  const globalRefs = React.useMemo(() => {
    const refs = new Map<string, number>();

    cells.forEach((cell) => {
      cell?.analysis?.references?.forEach((ref) => {
        if (ref?.name) {
          const current = refs.get(ref.name) || 0;
          refs.set(ref.name, current + (ref.count || 0));
        }
      });
    });

    return refs;
  }, [cells]);

  return (
    <div className="h-full flex flex-col border-l border-border">
      <div className="flex-1 overflow-auto p-2">
        {globals.length === 0 ? (
          <div className="text-xs text-muted-foreground p-2">
            No global variables defined
          </div>
        ) : (
          <div className="space-y-2">
            {globals.map(({ name, value, type, sourceCell }) => (
              <div
                key={`${sourceCell}-${name}`}
                className="flex items-center gap-2 p-2 rounded-md hover:bg-muted"
              >
                <Variable className="w-3 h-3 text-blue-500" />
                <span className="font-mono text-xs">{name}</span>
                <div className="ml-auto flex items-center gap-2">
                  {(globalRefs.get(name) ?? 0) > 0 && (
                    <span className="text-[10px] bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded-full">
                      {globalRefs.get(name)} refs
                    </span>
                  )}
                  <span className="text-[10px] text-muted-foreground">
                    {type}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});
