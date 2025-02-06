import { create } from "zustand"
import { immer } from "zustand/middleware/immer"

export interface Command {
  id: string
  name: string
  description?: string
  category: "global" | "cell" | "notebook"
  handler: () => void
}

interface CommandState {
  commands: Command[]
  searchQuery: string
}

type CommandStore = CommandState & {
  registerCommand: (command: Command) => void
  unregisterCommand: (id: string) => void
  setSearchQuery: (query: string) => void
  getFilteredCommands: () => Command[]
}

export function registerGlobalVariable(name: string, value: any) {
  useCommandStore.getState().registerCommand({
    id: `global-${name}`,
    name: name,
    category: "global",
    handler: () => {
      console.log("global variable", name, value)
    },
  })
}

export const useCommandStore = create<CommandStore>()(
  immer((set, get) => ({
    commands: [],
    searchQuery: "",

    registerCommand: (command) =>
      set((state) => {
        state.commands.push(command)
      }),

    unregisterCommand: (id) =>
      set((state) => {
        state.commands = state.commands.filter((cmd) => cmd.id !== id)
      }),

    setSearchQuery: (query) =>
      set((state) => {
        state.searchQuery = query
      }),

    getFilteredCommands: () => {
      const state = get()
      const query = state.searchQuery.toLowerCase()

      if (!query) return state.commands

      return state.commands.filter(
        (cmd) =>
          cmd.name.toLowerCase().includes(query) ||
          cmd.description?.toLowerCase().includes(query),
      )
    },
  })),
)
