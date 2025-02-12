import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ErrorScreen, LoaderScreen } from "./components/swc-loader";
import { useSwcInit } from "./hooks/use-swc-init";
import "./index.css";
import { queryClient } from "./lib/query-client";
import { initializeTheme } from "./lib/theme";
import { Notebook } from "./notebook/notebook";

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
    <QueryClientProvider client={queryClient}>
      <App />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </StrictMode>,
);
