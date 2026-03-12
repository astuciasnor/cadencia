import type { AppState } from "@/domain/types";

export interface AppStateAdapter {
  load(): AppState;
  save(state: AppState): AppState;
  reset(): AppState;
}
