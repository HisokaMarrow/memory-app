import { useCallback, useEffect, useRef } from "react";

type GameTimeout = ReturnType<typeof globalThis.setTimeout>;
type GameInterval = ReturnType<typeof globalThis.setInterval>;

/** Tracks a game's timers so exiting can cancel them synchronously. */
export function useGameTimers() {
  const timeoutsRef = useRef(new Set<GameTimeout>());
  const intervalsRef = useRef(new Set<GameInterval>());

  const setGameTimeout = useCallback((callback: () => void, delay: number) => {
    let timer: GameTimeout;
    timer = globalThis.setTimeout(() => {
      timeoutsRef.current.delete(timer);
      callback();
    }, delay);
    timeoutsRef.current.add(timer);
    return timer;
  }, []);

  const clearGameTimeout = useCallback((timer: GameTimeout) => {
    globalThis.clearTimeout(timer);
    timeoutsRef.current.delete(timer);
  }, []);

  const setGameInterval = useCallback((callback: () => void, delay: number) => {
    const timer = globalThis.setInterval(callback, delay);
    intervalsRef.current.add(timer);
    return timer;
  }, []);

  const clearGameInterval = useCallback((timer: GameInterval) => {
    globalThis.clearInterval(timer);
    intervalsRef.current.delete(timer);
  }, []);

  const clearGameTimers = useCallback(() => {
    timeoutsRef.current.forEach((timer) => globalThis.clearTimeout(timer));
    intervalsRef.current.forEach((timer) => globalThis.clearInterval(timer));
    timeoutsRef.current.clear();
    intervalsRef.current.clear();
  }, []);

  useEffect(() => clearGameTimers, [clearGameTimers]);

  return {
    clearGameInterval,
    clearGameTimeout,
    clearGameTimers,
    setGameInterval,
    setGameTimeout,
  };
}
