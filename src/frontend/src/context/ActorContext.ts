import { createContext, useContext } from "react";
import type { backendInterface } from "../backend";

export interface ActorContextValue {
  actor: backendInterface | null;
  isActorReady: boolean;
}

export const ActorContext = createContext<ActorContextValue>({
  actor: null,
  isActorReady: false,
});

export function useActorContext(): ActorContextValue {
  return useContext(ActorContext);
}
