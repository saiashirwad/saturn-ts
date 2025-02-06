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
import { useCommandStore } from "./command-store"

export function CommandPalette() {
  const [open, setOpen] = React.useState(false)
  const addCell = useNotebookStore((state) => state.addCell)
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
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Actions">
          <CommandItem
            onSelect={() => {
              addCell("code")
              setOpen(false)
            }}
          >
            <Search className="w-4 h-4 mr-2" />
            Add Code Cell
          </CommandItem>
        </CommandGroup>

        <CommandGroup heading="Global Variables">
          {Object.entries(globals).map(([name, value]) => {
            console.log(value)
            return (
              <CommandItem
                key={name}
                onSelect={() => {
                  // Could add action here if needed
                  setOpen(false)
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
            )
          })}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
