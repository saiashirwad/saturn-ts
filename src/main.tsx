import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { StrictMode, useRef } from "react";
import { createRoot } from "react-dom/client";
import { NotebookHandle, NotebookVanilla } from "./core/notebook-react";
import "./index.css";
import { queryClient } from "./lib/query-client";
import { initializeTheme } from "./lib/theme";

initializeTheme();

function Haha() {
  const notebookRef = useRef<NotebookHandle>(null);

  const handleAddCell = () => {
    notebookRef.current?.addCell();
  };

  return (
    <div>
      <button onClick={handleAddCell}>Add Cell</button>
      <NotebookVanilla
        ref={notebookRef}
        className="my-notebook"
        initialState={{
          cells: [
            { id: "1", type: "code", content: 'console.log("Hello World!")' },
          ],
        }}
        onStateChange={(state) => console.log("Notebook state:", state)}
        onCellExecuted={(cellId, output) =>
          console.log(`Cell ${cellId} output:`, output)
        }
      />
    </div>
  );
}
function App() {
  // return <Notebook />;
  return <Haha />;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </StrictMode>,
);
