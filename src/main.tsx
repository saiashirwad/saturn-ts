import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { initializeTheme } from "./lib/theme";
import { Notebook } from "./notebook/notebook";
import { useDarkMode } from "./utils/use-dark-mode";

initializeTheme();

function App() {
  useDarkMode();
  return <Notebook />;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
