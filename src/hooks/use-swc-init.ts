import initSwc from "@swc/wasm-web";
import { useEffect, useState } from "react";

interface SwcInitState {
  initialized: boolean;
  error: string | null;
  loading: boolean;
}

export function useSwcInit(): SwcInitState {
  const [state, setState] = useState<SwcInitState>({
    initialized: false,
    error: null,
    loading: true,
  });

  useEffect(() => {
    async function initializeSwc() {
      try {
        const swcWasm = await fetch(
          "https://esm.sh/@swc/wasm-web/wasm_bg.wasm",
        );
        const wasmBuffer = await swcWasm.arrayBuffer();
        await initSwc(wasmBuffer);
        setState({ initialized: true, error: null, loading: false });
      } catch (err) {
        setState({
          initialized: false,
          error:
            err instanceof Error ? err.message : "Failed to initialize SWC",
          loading: false,
        });
      }
    }

    initializeSwc();
  }, []);

  return state;
}
