import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { initializeTheme } from "./lib/theme";
import { Notebook } from "./notebook/notebook";
import { LoaderScreen, ErrorScreen } from "./components/swc-loader";
import { useSwcInit } from "./hooks/use-swc-init";

initializeTheme();

function App() {
  const { initialized, error, loading } = useSwcInit();

  if (loading) {
    return <LoaderScreen text="Loading dependencies..." />;
  }

  if (error) {
    return <ErrorScreen error={error} />;
  }

  if (!initialized) {
    return <ErrorScreen error="Failed to initialize dependencies" />;
  }

  return <Notebook />;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
