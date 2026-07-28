import type { User } from "@supabase/supabase-js";

import { supabase } from "../../lib/supabase";

let cachedUser: User | null = null;
let pendingSessionCheck: Promise<User | null> | null = null;
let sessionVersion = 0;

export function getCachedDashboardUser() {
  return cachedUser;
}

export function cacheDashboardUser(user: User | null) {
  sessionVersion += 1;
  cachedUser = user;
}

export function clearDashboardUser() {
  sessionVersion += 1;
  cachedUser = null;
  pendingSessionCheck = null;
}

export function loadDashboardUser() {
  if (!pendingSessionCheck) {
    const checkVersion = sessionVersion;
    pendingSessionCheck = supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (checkVersion !== sessionVersion) return cachedUser;
        cachedUser = session?.user ?? null;
        return cachedUser;
      })
      .finally(() => {
        pendingSessionCheck = null;
      });
  }

  return pendingSessionCheck;
}
