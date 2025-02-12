import { use$ } from "@legendapp/state/react";
import { Search, Variable } from "lucide-react";
import * as React from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../components/ui/command";
import { addCell, notebook$, setFocusedCell } from "../notebook/notebook-store";
import { command$, commandPalette$ } from "./command-store";

export function CommandPalette() {
  const isOpen = use$(commandPalette$.isOpen);
  const cells = use$(notebook$.cells);
  const globalVariables = use$(command$.commands);

  const globals = React.useMemo(() => {
    return Object.fromEntries(
      globalVariables
        .filter((cmd) => cmd.category === "global")
        .map((cmd) => [cmd.name, cmd.handler]),
    );
  }, [globalVariables]);

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
              addCell("reactive");
              commandPalette$.isOpen.set(false);
            }}
          >
            <Search className="w-4 h-4 mr-2" />
            New Reactive Cell
          </CommandItem>

          <CommandItem
            onSelect={() => {
              addCell("non-reactive");
              commandPalette$.isOpen.set(false);
            }}
          >
            <Search className="w-4 h-4 mr-2" />
            Non Reactive
          </CommandItem>
        </CommandGroup>

        <CommandGroup heading="Cells">
          {cells.map((cell, index) => (
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
                <span>Focus Cell {index + 1}</span>
              </div>
              <span className="text-xs opacity-75 font-mono">{cell.type}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandGroup heading="Global Variables">
          {Object.entries(globals).map(([name, _]) => (
            <CommandItem
              key={name}
              onSelect={() => {
                // Could add action here if needed
                commandPalette$.isOpen.set(false);
              }}
              className="flex justify-between items-center"
            >
              <div className="flex items-center">
                <Variable className="w-4 h-4 mr-2 text-blue-500" />
                <span className="font-mono">{name}</span>
              </div>
              <span className="text-xs opacity-75 text-blue-500 font-mono">
                global
              </span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  ) : null;
}
