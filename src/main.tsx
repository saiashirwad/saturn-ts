import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { Notebook } from "./notebook/notebook";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

function App() {
  return <Notebook />;
}
