import { useRxSuspenseSuccess, useRxValue } from "@effect-rx/rx-react"
import { createContext, useContext } from "react"
import { RxSaturnHandle, saturnHandleRx } from "./services/runtime"

export const SaturnContext = createContext<RxSaturnHandle>(null as any)

export function SaturnProvider({ children }: React.PropsWithChildren<{}>) {
  const { value } = useRxSuspenseSuccess(saturnHandleRx({}))
  return (
    <SaturnContext.Provider value={value}>{children}</SaturnContext.Provider>
  )
}

export const useSaturn = () => {
  const value = useContext(SaturnContext)
  if (!value) {
    throw new Error("SaturnContext not found")
  }
  return value
}

export const useOutput = () => {
  const saturn = useSaturn()
  const output = useRxValue(saturn.output)
  console.log("Current output value:", output) // Debug log
  return output
}
