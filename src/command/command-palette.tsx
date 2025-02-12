import { For, observer, use$ } from "@legendapp/state/react";
import { Search, Trash2, Variable } from "lucide-react";
import * as React from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../components/ui/command";
import { addCell, deleteCell, notebook$ } from "../notebook/notebook-store";
import { command$, commandPalette$ } from "./command-store";

export const CommandPalette = observer(() => {
  const isOpen = use$(commandPalette$.isOpen);
  const focusedCell = use$(notebook$.focusedCellId);
  const globals = use$(notebook$.globals);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        commandPalette$.isOpen.set(true);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return isOpen ? (
    <CommandDialog
      open={isOpen}
      onOpenChange={(s) => {
        commandPalette$.isOpen.set(s);
      }}
    >
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Actions">
          <CommandItem
            onSelect={() => {
              addCell("code");
              commandPalette$.isOpen.set(false);
            }}
          >
            <Search className="w-4 h-4 mr-2" />
            New Code Cell
          </CommandItem>

          <CommandItem
            onSelect={() => {
              addCell("text");
              commandPalette$.isOpen.set(false);
            }}
          >
            <Search className="w-4 h-4 mr-2" />
            New Text Cell
          </CommandItem>

          {focusedCell && (
            <CommandItem
              onSelect={() => {
                deleteCell(focusedCell);
                commandPalette$.isOpen.set(false);
              }}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Cell
            </CommandItem>
          )}
        </CommandGroup>

        {/* <CommandGroup heading="Cells">
          <For each={notebook$.cells}>
            {(cell$, index) => {
              const cell = cell$.get();
              return (
                <CommandItem
                  key={cell.id}
                  onSelect={() => {
                    setFocusedCell(cell.id);
                    commandPalette$.isOpen.set(false);
                  }}
                  className="flex justify-between items-center"
                >
                  <div className="flex items-center">
                    <Search className="w-4 h-4 mr-2" />
                    <span>Focus Cell {index}</span>
                  </div>
                  <span className="text-xs opacity-75 font-mono">
                    {cell.type}
                  </span>
                </CommandItem>
              );
            }}
          </For>
        </CommandGroup> */}

        <CommandGroup heading="Global Variables">
          <For each={notebook$.globals}>
            {(cmd) => (
              <CommandItem
                key={cmd.name.get()}
                onSelect={() => {
                  commandPalette$.isOpen.set(false);
                }}
                className="flex justify-between items-center"
              >
                <div className="flex items-center">
                  <Variable className="w-4 h-4 mr-2 text-blue-500" />
                  <span className="font-mono">{cmd.name.get()}</span>
                </div>
                <span className="text-xs opacity-75 text-blue-500 font-mono">
                  global
                </span>
              </CommandItem>
            )}
          </For>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  ) : null;
});
