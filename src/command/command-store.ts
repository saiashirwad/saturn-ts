import { observable } from "@legendapp/state";

export interface Command {
  id: string;
  name: string;
  description?: string;
  category: "global" | "cell" | "notebook";
  handler: () => void;
}

interface CommandState {
  commands: Command[];
  searchQuery: string;
  globalVariables: Command[];
}

interface CommandPaletteState {
  isOpen: boolean;
}

type CommandStore = CommandState & {
  unregisterCommand: (id: string) => void;
  setSearchQuery: (query: string) => void;
  filteredCommands: Command[];
};

type CommandPaletteStore = CommandPaletteState & {
  toggle: () => void;
};

export const registerGlobalVariable: (name: string, value: any) => void = (
  name,
  value,
) => {
  command$.commands.push({
    id: `global-${name}`,
    name,
    category: "global",
    handler: () => {
      console.log("global variable", name, value);
    },
  });
};

export const command$ = observable<CommandStore>({
  commands: [],
  searchQuery: "",
  globalVariables: () =>
    command$.commands.filter((cmd) => cmd.category.get() === "global"),

  unregisterCommand: (id) => {
    const index = command$.commands.findIndex((cmd) => cmd.id.peek() === id);
    if (index !== -1) {
      command$.commands.splice(index, 1);
    }
  },

  setSearchQuery: (query) => {
    command$.searchQuery.set(query);
  },

  filteredCommands: () => {
    const query = command$.searchQuery.get().toLowerCase();
    if (!query) return command$.commands;
    const comamnds = command$.commands.get();
    return comamnds.filter(
      (cmd) =>
        cmd.name.toLowerCase().includes(query) ||
        cmd.description?.toLowerCase().includes(query),
    );
  },
});

export const commandPalette$ = observable<CommandPaletteStore>({
  isOpen: false,

  toggle: () => {
    commandPalette$.isOpen.set(!commandPalette$.isOpen);
  },
});
