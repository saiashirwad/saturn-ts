import initSwc from "@swc/wasm-web";
import { useQuery } from "@tanstack/react-query";

interface SwcInitState {
  initialized: boolean;
  error: string | null;
  loading: boolean;
}

export function useSwcInit(): SwcInitState {
  const { data, isLoading, error } = useQuery({
    queryKey: ["swc-init"],
    queryFn: async () => {
      const swcWasm = await fetch("https://esm.sh/@swc/wasm-web/wasm_bg.wasm");
      const wasmBuffer = await swcWasm.arrayBuffer();
      await initSwc(wasmBuffer);
      return true;
    },
  });

  return {
    initialized: Boolean(data),
    loading: isLoading,
    error:
      error instanceof Error ? error.message : error ? String(error) : null,
  };
}
