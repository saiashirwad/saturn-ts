import * as React from "react"
import { Search } from "lucide-react"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../components/ui/command"
import { useNotebookStore } from "../store"

export function CommandPalette() {
  const [open, setOpen] = React.useState(false)
  const addCell = useNotebookStore((state) => state.addCell)

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
      </CommandList>
    </CommandDialog>
  )
}
