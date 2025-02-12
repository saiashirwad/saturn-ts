import { render } from "solid-js/web";
import { Notebook } from "./components/notebook/Notebook";
import "./index.css";
import { initializeTheme } from "./lib/theme";

initializeTheme();

const initialCell = {
  id: "1",
  type: "code" as const,
  content: 'console.log("Hello World!")',
};

const App = () => {
  return (
    <div class="w-full h-full">
      <Notebook
        class="my-notebook"
        initialState={{
          cells: [initialCell],
          focusedCellId: null,
          globals: {},
        }}
      />
    </div>
  );
};

render(() => <App />, document.getElementById("root")!);
