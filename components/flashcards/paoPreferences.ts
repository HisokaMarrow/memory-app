import AsyncStorage from "@react-native-async-storage/async-storage";

import type { DrillConfig } from "./drillEngine";

const PREFIX = "memoro-pao-drill";

export async function loadDrillPreferences(systemId: string): Promise<Partial<DrillConfig> | null> {
  const key = `${PREFIX}:${systemId}`;
  try {
    const raw = typeof localStorage !== "undefined" ? localStorage.getItem(key) : await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function saveDrillPreferences(config: DrillConfig) {
  const key = `${PREFIX}:${config.systemId}`;
  const value = JSON.stringify(config);
  if (typeof localStorage !== "undefined") localStorage.setItem(key, value);
  else await AsyncStorage.setItem(key, value);
}
