import { createDefaultAppState, hydrateAppState, syncAppState } from "@/domain/app-state";
import type { AppState } from "@/domain/types";
import type { AppStateAdapter } from "./types";

const STORAGE_KEY = "cadencia:v2:app-state";

function canUseLocalStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function createLocalStorageAppStateAdapter(storageKey = STORAGE_KEY): AppStateAdapter {
  return {
    load() {
      const fallback = createDefaultAppState();
      if (!canUseLocalStorage()) {
        return fallback;
      }

      try {
        const rawValue = window.localStorage.getItem(storageKey);
        if (!rawValue) {
          return fallback;
        }

        return hydrateAppState(JSON.parse(rawValue));
      } catch {
        return fallback;
      }
    },

    save(state: AppState) {
      const normalizedState = syncAppState({
        ...state,
        updatedAt: new Date().toISOString()
      });

      if (canUseLocalStorage()) {
        window.localStorage.setItem(storageKey, JSON.stringify(normalizedState));
      }

      return normalizedState;
    },

    reset() {
      const initialState = createDefaultAppState();

      if (canUseLocalStorage()) {
        window.localStorage.setItem(storageKey, JSON.stringify(initialState));
      }

      return initialState;
    }
  };
}

export const localStorageAppStateAdapter = createLocalStorageAppStateAdapter();
