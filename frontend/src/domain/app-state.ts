import { APP_STATE_VERSION } from "./constants";
import { clearActiveDayPlanItem, normalizeDayPlanState, setActiveDayPlanItem } from "./day-plan";
import { sanitizeExecutionRecord } from "./execution";
import { resolveCurrentFocus } from "./focus";
import { createProvisionalProject, ensureProvisionalProject, hydrateProjects } from "./projects";
import { clearFocus, hydrateTasks, setSubtaskFocus, setTaskFocus } from "./tasks";
import { createDefaultTimerSession, createDefaultTimerSettings, sanitizeTimerSession, sanitizeTimerSettings } from "./timer";
import type { AppState, DayHistoryEntry } from "./types";

function normalizeIsoTimestamp(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function clampCounter(value: unknown) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return 0;
  }

  return Math.max(0, Math.round(numeric));
}

function sanitizeHistoryRecord(value: Record<string, Partial<DayHistoryEntry>> | null | undefined) {
  if (!value || typeof value !== "object") {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => key.trim().length > 0)
      .map(([key, entry]) => [
        key,
        {
          date: typeof entry?.date === "string" && entry.date.trim().length > 0 ? entry.date : key,
          completedFocusSessions: clampCounter(entry?.completedFocusSessions),
          completedMicroPauses: clampCounter(entry?.completedMicroPauses),
          completedLongBreaks: clampCounter(entry?.completedLongBreaks),
          focusedMinutes: clampCounter(entry?.focusedMinutes),
          updatedAt: normalizeIsoTimestamp(entry?.updatedAt)
        }
      ])
  );
}

export function createDefaultAppState(): AppState {
  const settings = createDefaultTimerSettings();

  return {
    version: APP_STATE_VERSION,
    updatedAt: null,
    settings,
    projects: [createProvisionalProject()],
    tasks: [],
    dayPlan: normalizeDayPlanState(),
    execution: {},
    currentFocus: null,
    currentSession: createDefaultTimerSession(settings),
    history: {}
  };
}

export function syncAppState(state: AppState): AppState {
  const projects = ensureProvisionalProject(state.projects);
  const tasks = hydrateTasks(state.tasks, projects);
  const dayPlan = normalizeDayPlanState(state.dayPlan);
  const currentFocus = resolveCurrentFocus(tasks, dayPlan);

  return {
    ...state,
    projects,
    tasks,
    dayPlan,
    currentFocus
  };
}

export function hydrateAppState(value: Partial<AppState> | null | undefined): AppState {
  const defaults = createDefaultAppState();
  const settings = sanitizeTimerSettings(value?.settings);

  return syncAppState({
    version: typeof value?.version === "number" ? value.version : defaults.version,
    updatedAt: normalizeIsoTimestamp(value?.updatedAt),
    settings,
    projects: hydrateProjects(value?.projects),
    tasks: hydrateTasks(value?.tasks, hydrateProjects(value?.projects)),
    dayPlan: normalizeDayPlanState(value?.dayPlan),
    execution: sanitizeExecutionRecord(value?.execution),
    currentFocus: null,
    currentSession: sanitizeTimerSession(value?.currentSession, settings),
    history: sanitizeHistoryRecord(value?.history)
  });
}

export function clearCurrentFocus(state: AppState): AppState {
  return syncAppState({
    ...state,
    tasks: clearFocus(state.tasks),
    dayPlan: clearActiveDayPlanItem(state.dayPlan)
  });
}

export function setFocusedTask(state: AppState, taskId: string): AppState {
  return syncAppState({
    ...state,
    tasks: setTaskFocus(state.tasks, taskId),
    dayPlan: clearActiveDayPlanItem(state.dayPlan)
  });
}

export function setFocusedSubtask(state: AppState, taskId: string, subtaskId: string): AppState {
  return syncAppState({
    ...state,
    tasks: setSubtaskFocus(state.tasks, taskId, subtaskId),
    dayPlan: clearActiveDayPlanItem(state.dayPlan)
  });
}

export function setFocusedStandaloneDayPlanItem(state: AppState, itemId: string): AppState {
  const selectedItem = state.dayPlan.items.find((item) => item.id === itemId && item.kind === "standalone");
  if (!selectedItem) {
    return state;
  }

  return syncAppState({
    ...state,
    tasks: clearFocus(state.tasks),
    dayPlan: setActiveDayPlanItem(state.dayPlan, itemId)
  });
}
