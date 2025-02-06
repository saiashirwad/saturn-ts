import { Search, Variable } from "lucide-react"
import * as React from "react"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../components/ui/command"
import { useNotebookStore } from "../notebook/notebook-store"
import { useCommandPaletteStore, useCommandStore } from "./command-store"

export function CommandPalette() {
  const isOpen = useCommandPaletteStore((state) => state.isOpen)
  const setIsOpen = useCommandPaletteStore((state) => state.setIsOpen)
  const addCell = useNotebookStore((state) => state.addCell)
  const cells = useNotebookStore((state) => state.cells)
  const setFocusedCell = useNotebookStore((state) => state.setFocusedCell)
  const globalVariables = useCommandStore((state) => state.commands)

  const globals = React.useMemo(() => {
    return Object.fromEntries(
      globalVariables
        .filter((cmd) => cmd.category === "global")
        .map((cmd) => [cmd.name, cmd.handler]),
    )
  }, [globalVariables])

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setIsOpen(true)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  return isOpen ? (
    <CommandDialog open={isOpen} onOpenChange={setIsOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Actions">
          <CommandItem
            onSelect={() => {
              addCell("code")
              setIsOpen(false)
            }}
          >
            <Search className="w-4 h-4 mr-2" />
            Add Code Cell
          </CommandItem>
        </CommandGroup>

        <CommandGroup heading="Cells">
          {cells.map((cell, index) => (
            <CommandItem
              key={cell.id}
              onSelect={() => {
                setFocusedCell(cell.id)
                setIsOpen(false)
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
                setIsOpen(false)
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
  ) : null
}
