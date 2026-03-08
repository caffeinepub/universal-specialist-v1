import { createContext, useContext } from "react";
import type { backendInterface } from "../backend";

export interface ActorContextValue {
  actor: backendInterface | null;
  isActorReady: boolean;
  actorError: string | null;
}

export const ActorContext = createContext<ActorContextValue>({
  actor: null,
  isActorReady: false,
  actorError: null,
});

export function useActorContext(): ActorContextValue {
  return useContext(ActorContext);
}
