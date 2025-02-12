import { observable } from "@legendapp/state";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { NotebookComponent } from "./core/notebook-react";
import { NotebookState } from "./core/notebook-vanilla";
import "./index.css";
import { queryClient } from "./lib/query-client";
import { initializeTheme } from "./lib/theme";

initializeTheme();

const state = observable<NotebookState>({
  cells: [{ id: "1", type: "code", content: 'console.log("Hello World!")' }],
  focusedCellId: null,
  globals: {},
});

function NotebookWrapper() {
  return (
    <div>
      <NotebookComponent className="my-notebook" state$={state} />
    </div>
  );
}

function App() {
  return <NotebookWrapper />;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </StrictMode>,
);
