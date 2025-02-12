import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { initializeTheme } from "./lib/theme";
import { Notebook } from "./notebook/notebook";

// Initialize theme before rendering
initializeTheme();

function App() {
  return <Notebook />;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
