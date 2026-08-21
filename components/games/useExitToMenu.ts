import {
  useCallback,
  useEffect,
  useRef,
  type Dispatch,
  type SetStateAction,
} from "react";
import { Alert, Platform } from "react-native";
import { router } from "expo-router";

type ExitToMenuOptions<TPhase extends string> = {
  phase: TPhase;
  setPhase: Dispatch<SetStateAction<TPhase>>;
  onExit?: () => void;
};

const ABANDON_MESSAGE = "Your progress in this run will be lost.";

/** Shared game exit flow for overlay close, system back, Escape, and results actions. */
export function useExitToMenu<TPhase extends string>({
  phase,
  setPhase,
  onExit,
}: ExitToMenuOptions<TPhase>) {
  const phaseRef = useRef(phase);
  const onExitRef = useRef(onExit);
  const exitingRef = useRef(false);

  phaseRef.current = phase;
  onExitRef.current = onExit;

  useEffect(() => {
    if (phase !== "setup") exitingRef.current = false;
  }, [phase]);

  const finishExit = useCallback(() => {
    if (exitingRef.current) return;
    exitingRef.current = true;
    onExitRef.current?.();
    setPhase("setup" as TPhase);
    router.replace("/games" as any);
  }, [setPhase]);

  return useCallback(() => {
    const currentPhase = phaseRef.current;
    const runInProgress = currentPhase !== "setup" && currentPhase !== "result";

    if (!runInProgress) {
      finishExit();
      return;
    }

    if (Platform.OS === "web" && typeof globalThis.confirm === "function") {
      if (globalThis.confirm("Abandon this run?\n\n" + ABANDON_MESSAGE)) {
        finishExit();
      }
      return;
    }

    Alert.alert("Abandon this run?", ABANDON_MESSAGE, [
      { text: "Keep playing", style: "cancel" },
      { text: "Abandon", style: "destructive", onPress: finishExit },
    ]);
  }, [finishExit]);
}
