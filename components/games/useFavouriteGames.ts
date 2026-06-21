import { useCallback, useEffect, useState } from "react";

import { getFavouriteGameIds, loadUserPreferences, toggleFavouriteGame } from "./gamePreferences";

export function useFavouriteGames() {
  const [favouriteIds, setFavouriteIds] = useState<string[]>([]);

  useEffect(() => {
    let alive = true;

    function refreshPreferences() {
      setFavouriteIds(getFavouriteGameIds());
      loadUserPreferences().then((preferences) => {
        if (alive) setFavouriteIds(preferences.favouriteGameIds);
      });
    }

    refreshPreferences();

    if (typeof window === "undefined" || typeof window.addEventListener !== "function") return () => {
      alive = false;
    };

    window.addEventListener("memoro-user-changed", refreshPreferences);
    return () => {
      alive = false;
      window.removeEventListener("memoro-user-changed", refreshPreferences);
    };
  }, []);

  const toggleFavourite = useCallback((gameId: string) => {
    setFavouriteIds(toggleFavouriteGame(gameId));
  }, []);

  return { favouriteIds, toggleFavourite };
}
