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

    function refreshFavourites(event: Event) {
      const nextIds = event instanceof CustomEvent ? event.detail : null;
      setFavouriteIds(Array.isArray(nextIds) ? nextIds : getFavouriteGameIds());
    }

    refreshPreferences();

    if (typeof window === "undefined" || typeof window.addEventListener !== "function") return () => {
      alive = false;
    };

    window.addEventListener("memoro-user-changed", refreshPreferences);
    window.addEventListener("memoro-favourites-updated", refreshFavourites);
    return () => {
      alive = false;
      window.removeEventListener("memoro-user-changed", refreshPreferences);
      window.removeEventListener("memoro-favourites-updated", refreshFavourites);
    };
  }, []);

  const toggleFavourite = useCallback((gameId: string) => {
    setFavouriteIds(toggleFavouriteGame(gameId));
  }, []);

  return { favouriteIds, toggleFavourite };
}
