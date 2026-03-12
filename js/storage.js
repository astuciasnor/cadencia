import {
  ensureTasksGroupedIntoProject,
  normalizeProjectCollection,
  normalizeTaskCollection
} from "./task-model.js";

const APP_STATE_KEY = "cadencia.app-state";
const STATE_VERSION = 3;

const LEGACY_KEYS = {
  settings: "cadencia.settings",
  projects: "cadencia.projects",
  tasks: "cadencia.tasks",
  session: "cadencia.session",
  history: "cadencia.history",
  dayPlan: "cadencia.day-plan",
  execution: "cadencia.execution"
};

const MANAGED_KEYS = new Set(Object.values(LEGACY_KEYS));

const DEFAULT_SETTINGS = {
  focusMinutes: 25,
  microBreakMinutes: 5,
  longBreakMinutes: 15,
  dailyTarget: 6,
  cyclesUntilLongBreak: 4,
  phaseEndSoundEnabled: true
};

export const storage = {
  getDefaultState,
  loadState,
  saveState,
  createBackup,
  restoreBackup,
  updateState,
  updateTodayHistory,
  resetState,
  getTodayHistory,
  updateCurrentSession,
  recordPhaseCompletion,
  get,
  set,
  remove
};

function getDefaultState() {
  const todayKey = getTodayKey();
  const defaultTasks = [];

  return {
    version: STATE_VERSION,
    updatedAt: null,
    settings: { ...DEFAULT_SETTINGS },
    projects: [],
    tasks: defaultTasks,
    dayPlan: createDefaultDayPlanState(),
    execution: createDefaultExecutionState(),
    currentSession: createDefaultSession(DEFAULT_SETTINGS),
    history: normalizeHistory(
      {
        days: {
          [todayKey]: createDefaultHistoryEntry(todayKey)
        }
      },
      defaultTasks
    )
  };
}

function loadState() {
  const storedState = readJson(APP_STATE_KEY, null);
  const legacySettings = readJson(LEGACY_KEYS.settings, null);
  const legacyProjects = readJson(LEGACY_KEYS.projects, null);
  const legacyTasks = readJson(LEGACY_KEYS.tasks, null);
  const legacyDayPlan = readJson(LEGACY_KEYS.dayPlan, null);
  const legacyExecution = readJson(LEGACY_KEYS.execution, null);
  const legacySession = readJson(LEGACY_KEYS.session, null);
  const legacyHistory = readJson(LEGACY_KEYS.history, null);
  const normalizedState = normalizeState({
    version: storedState?.version,
    updatedAt: storedState?.updatedAt,
    settings: storedState?.settings ?? legacySettings,
    projects: resolveRecoveredSlice(storedState?.projects, legacyProjects),
    tasks: resolveRecoveredSlice(storedState?.tasks, legacyTasks),
    dayPlan: storedState?.dayPlan ?? legacyDayPlan,
    execution: storedState?.execution ?? legacyExecution,
    currentSession: storedState?.currentSession ?? legacySession,
    history: storedState?.history ?? legacyHistory
  });

  persistNormalizedState(normalizedState);
  return normalizedState;
}

function saveState(nextState) {
  const normalizedState = normalizeState(nextState);
  const stateToSave = {
    ...normalizedState,
    updatedAt: createTimestamp()
  };

  persistNormalizedState(stateToSave);
  return stateToSave;
}

function createBackup() {
  const state = loadState();

  return {
    format: "cadencia-backup",
    backupVersion: 1,
    appStateVersion: state.version,
    exportedAt: createTimestamp(),
    state
  };
}

function restoreBackup(payload) {
  const extractedState = extractBackupState(payload);
  return saveState(extractedState);
}

function updateState(updater) {
  const currentState = loadState();
  const nextState =
    typeof updater === "function"
      ? updater(currentState)
      : {
          ...currentState,
          ...updater
        };

  return saveState(nextState);
}

function updateTodayHistory(patch) {
  return updateState((state) => {
    const todayKey = getTodayKey();
    const todayHistory = normalizeHistoryEntry(todayKey, state.history.days[todayKey]);
    const nextHistory =
      typeof patch === "function"
        ? patch(todayHistory)
        : {
            ...todayHistory,
            ...patch
          };

    return {
      ...state,
      history: {
        days: {
          ...state.history.days,
          [todayKey]: normalizeHistoryEntry(todayKey, nextHistory)
        }
      }
    };
  });
}

function resetState() {
  return saveState(getDefaultState());
}

function getTodayHistory() {
  const state = loadState();
  return normalizeHistoryEntry(getTodayKey(), state.history.days[getTodayKey()]);
}

function updateCurrentSession(patch) {
  return updateState((state) => ({
    ...state,
    currentSession: normalizeSession(
      {
        ...state.currentSession,
        ...(typeof patch === "function" ? patch(state.currentSession) : patch)
      },
      state.settings
    )
  }));
}

function recordPhaseCompletion(phaseId, options = {}) {
  const counterKey = getPhaseCounterKey(phaseId);
  if (!counterKey) {
    return loadState();
  }

  const focusedMinutes =
    phaseId === "focus"
      ? sanitizeInteger(options.focusedMinutes, 0, 0, 1440)
      : 0;

  return updateTodayHistory((todayHistory) => ({
    ...todayHistory,
    [counterKey]: todayHistory[counterKey] + 1,
    focusedMinutes: todayHistory.focusedMinutes + focusedMinutes,
    updatedAt: createTimestamp()
  }));
}

function get(key, fallbackValue) {
  try {
    if (isManagedSliceKey(key)) {
      const slice = getManagedSlice(loadState(), key);
      return slice ?? fallbackValue;
    }

    const rawValue = window.localStorage.getItem(key);
    return rawValue ? JSON.parse(rawValue) : fallbackValue;
  } catch (error) {
    console.error(`Falha ao ler ${key} do localStorage.`, error);
    return fallbackValue;
  }
}

function set(key, value) {
  try {
    if (isManagedSliceKey(key)) {
      const currentState = loadState();
      saveState(applyManagedSlice(currentState, key, value));
      return value;
    }

    writeJson(key, value);
    return value;
  } catch (error) {
    console.error(`Falha ao salvar ${key} no localStorage.`, error);
    return value;
  }
}

function remove(key) {
  try {
    if (isManagedSliceKey(key)) {
      const currentState = loadState();

      switch (key) {
        case LEGACY_KEYS.settings:
          return saveState({
            ...currentState,
            settings: { ...DEFAULT_SETTINGS }
          });
        case LEGACY_KEYS.projects:
          return saveState({
            ...currentState,
            projects: [],
            tasks: reconcileTaskProjects(currentState.tasks, [])
          });
        case LEGACY_KEYS.tasks:
          return saveState({
            ...currentState,
            tasks: []
          });
        case LEGACY_KEYS.session:
          return saveState({
            ...currentState,
            currentSession: createDefaultSession(currentState.settings)
          });
        case LEGACY_KEYS.dayPlan:
          return saveState({
            ...currentState,
            dayPlan: createDefaultDayPlanState()
          });
        case LEGACY_KEYS.execution:
          return saveState({
            ...currentState,
            execution: createDefaultExecutionState()
          });
        case LEGACY_KEYS.history:
          return saveState({
            ...currentState,
            history: getDefaultState().history
          });
        default:
          return currentState;
      }
    }

    window.localStorage.removeItem(key);
    return null;
  } catch (error) {
    console.error(`Falha ao remover ${key} do localStorage.`, error);
    return null;
  }
}

function normalizeState(rawState) {
  const settings = normalizeSettings(rawState?.settings);
  const structuredData = ensureTasksGroupedIntoProject(
    reconcileTaskProjects(
      normalizeTaskCollection(rawState?.tasks, []),
      normalizeProjectCollection(rawState?.projects, [])
    ),
    normalizeProjectCollection(rawState?.projects, [])
  );
  const projects = structuredData.projects;
  const tasks = structuredData.tasks;
  const history = normalizeHistory(rawState?.history, tasks);

  return {
    version: STATE_VERSION,
    updatedAt: typeof rawState?.updatedAt === "string" ? rawState.updatedAt : null,
    settings,
    projects,
    tasks,
    dayPlan: normalizeDayPlanState(rawState?.dayPlan),
    execution: normalizeExecutionState(rawState?.execution),
    currentSession: normalizeSession(rawState?.currentSession, settings),
    history
  };
}

function normalizeExecutionState(rawExecution) {
  const rawEntries = rawExecution && typeof rawExecution.entries === "object"
    ? rawExecution.entries
    : {};
  const entries = {};

  Object.entries(rawEntries).forEach(([key, entry]) => {
    if (!key) {
      return;
    }

    entries[key] = normalizeExecutionEntry(entry);
  });

  return { entries };
}

function normalizeExecutionEntry(entry) {
  const actions = Array.isArray(entry?.actions)
    ? entry.actions.filter((action) => EXECUTION_ACTIONS.includes(action))
    : [];

  return {
    mode: normalizeExecutionMode(entry?.mode),
    materials: normalizeTextBlock(entry?.materials),
    actions,
    contacts: normalizeTextBlock(entry?.contacts),
    phones: normalizeTextBlock(entry?.phones),
    notes: normalizeTextBlock(entry?.notes),
    instructions: normalizeTextBlock(entry?.instructions),
    expectedMinutesOverride: normalizeOptionalPositiveInteger(entry?.expectedMinutesOverride),
    focusMinutesOverride: normalizeOptionalPositiveInteger(entry?.focusMinutesOverride),
    shortBreakMinutesOverride: normalizeOptionalPositiveInteger(entry?.shortBreakMinutesOverride),
    longBreakMinutesOverride: normalizeOptionalPositiveInteger(entry?.longBreakMinutesOverride),
    manualCycles: normalizeOptionalPositiveInteger(entry?.manualCycles),
    updatedAt: normalizeNullableString(entry?.updatedAt)
  };
}

function normalizeDayPlanState(rawDayPlan) {
  const rawItems = Array.isArray(rawDayPlan?.items) ? rawDayPlan.items : [];
  const items = rawItems
    .filter((item) => item && typeof item === "object")
    .map(normalizeDayPlanItem);
  const activeItemId = typeof rawDayPlan?.activeItemId === "string" && rawDayPlan.activeItemId
    ? rawDayPlan.activeItemId
    : null;
  const standaloneActiveItem = items.find((item) => item.id === activeItemId && item.kind === "standalone") ?? null;

  return {
    items,
    activeItemId: standaloneActiveItem?.id ?? null
  };
}

function normalizeDayPlanItem(item) {
  return {
    id: typeof item.id === "string" && item.id ? item.id : createDayPlanId(),
    kind: normalizeDayPlanKind(item.kind),
    title: normalizeDayPlanTitle(item.title),
    priority: normalizeDayPlanPriority(item.priority),
    completed: Boolean(item.completed),
    sourceTaskId: normalizeNullableString(item.sourceTaskId),
    sourceSubtaskId: normalizeNullableString(item.sourceSubtaskId),
    createdAt: normalizeNullableString(item.createdAt) || createTimestamp()
  };
}

function normalizeSettings(rawSettings) {
  return {
    focusMinutes: sanitizeInteger(rawSettings?.focusMinutes, DEFAULT_SETTINGS.focusMinutes, 1, 120),
    microBreakMinutes: sanitizeInteger(rawSettings?.microBreakMinutes, DEFAULT_SETTINGS.microBreakMinutes, 1, 60),
    longBreakMinutes: sanitizeInteger(rawSettings?.longBreakMinutes, DEFAULT_SETTINGS.longBreakMinutes, 1, 90),
    dailyTarget: sanitizeInteger(rawSettings?.dailyTarget, DEFAULT_SETTINGS.dailyTarget, 1, 20),
    phaseEndSoundEnabled: normalizeBoolean(rawSettings?.phaseEndSoundEnabled, DEFAULT_SETTINGS.phaseEndSoundEnabled),
    cyclesUntilLongBreak: sanitizeInteger(
      rawSettings?.cyclesUntilLongBreak,
      DEFAULT_SETTINGS.cyclesUntilLongBreak,
      2,
      12
    )
  };
}

function normalizeSession(rawSession, settings) {
  const phaseId = normalizePhaseId(rawSession?.phaseId);
  const durationSeconds = getPhaseDuration(phaseId, settings);

  return {
    phaseId,
    phaseLabel: getPhaseLabel(phaseId),
    status: normalizeSessionStatus(rawSession?.status),
    remainingSeconds: sanitizeInteger(rawSession?.remainingSeconds, durationSeconds, 0, durationSeconds),
    durationSeconds: sanitizeInteger(rawSession?.durationSeconds, durationSeconds, 60, 60 * 60 * 12),
    startedAt: normalizeNullableString(rawSession?.startedAt),
    endsAt: normalizeNullableString(rawSession?.endsAt),
    updatedAt: normalizeNullableString(rawSession?.updatedAt),
    completedFocusCycles: sanitizeInteger(rawSession?.completedFocusCycles, 0, 0),
    focusCyclesSinceLongBreak: sanitizeInteger(
      rawSession?.focusCyclesSinceLongBreak,
      0,
      0,
      settings.cyclesUntilLongBreak
    ),
    nextFocusDurationSeconds: sanitizeInteger(rawSession?.nextFocusDurationSeconds, 0, 0, 60 * 60 * 4),
    cyclesUntilLongBreak: sanitizeInteger(
      rawSession?.cyclesUntilLongBreak,
      settings.cyclesUntilLongBreak,
      2,
      12
    )
  };
}

function normalizeHistory(rawHistory, tasks) {
  const todayKey = getTodayKey();
  const rawDays = rawHistory && typeof rawHistory.days === "object" ? rawHistory.days : {};
  const days = {};

  Object.entries(rawDays).forEach(([date, entry]) => {
    days[date] = normalizeHistoryEntry(date, entry);
  });

  const todayEntry = normalizeHistoryEntry(todayKey, days[todayKey]);
  const taskSummary = summarizeTasks(tasks);

  days[todayKey] = {
    ...todayEntry,
    totalTasks: taskSummary.total,
    completedTasks: taskSummary.completed
  };

  return { days };
}

function normalizeHistoryEntry(date, entry) {
  const baseEntry = createDefaultHistoryEntry(date);

  return {
    ...baseEntry,
    completedFocusSessions: sanitizeInteger(entry?.completedFocusSessions, baseEntry.completedFocusSessions, 0),
    completedMicroPauses: sanitizeInteger(entry?.completedMicroPauses, baseEntry.completedMicroPauses, 0),
    completedLongBreaks: sanitizeInteger(entry?.completedLongBreaks, baseEntry.completedLongBreaks, 0),
    focusedMinutes: sanitizeInteger(entry?.focusedMinutes, baseEntry.focusedMinutes, 0),
    totalTasks: sanitizeInteger(entry?.totalTasks, baseEntry.totalTasks, 0),
    completedTasks: sanitizeInteger(entry?.completedTasks, baseEntry.completedTasks, 0),
    updatedAt: normalizeNullableString(entry?.updatedAt)
  };
}

function createDefaultSession(settings) {
  const durationSeconds = settings.focusMinutes * 60;

  return {
    phaseId: "focus",
    phaseLabel: getPhaseLabel("focus"),
    status: "idle",
    remainingSeconds: durationSeconds,
    durationSeconds,
    startedAt: null,
    endsAt: null,
    completedFocusCycles: 0,
    focusCyclesSinceLongBreak: 0,
    nextFocusDurationSeconds: 0,
    cyclesUntilLongBreak: settings.cyclesUntilLongBreak,
    updatedAt: null
  };
}

function createDefaultDayPlanState() {
  return {
    items: [],
    activeItemId: null
  };
}

function createDefaultExecutionState() {
  return {
    entries: {}
  };
}

function createDefaultHistoryEntry(date) {
  return {
    date,
    completedFocusSessions: 0,
    completedMicroPauses: 0,
    completedLongBreaks: 0,
    focusedMinutes: 0,
    totalTasks: 0,
    completedTasks: 0,
    updatedAt: null
  };
}

function summarizeTasks(tasks) {
  return {
    total: tasks.length,
    completed: tasks.filter((task) => task.completed).length
  };
}

function applyManagedSlice(state, key, value) {
  switch (key) {
    case LEGACY_KEYS.settings: {
      const normalizedSettings = normalizeSettings(value);

      return {
        ...state,
        settings: normalizedSettings,
        currentSession: normalizeSession(state.currentSession, normalizedSettings)
      };
    }
    case LEGACY_KEYS.projects: {
      const structuredData = ensureTasksGroupedIntoProject(
        reconcileTaskProjects(state.tasks, normalizeProjectCollection(value, [])),
        normalizeProjectCollection(value, [])
      );

      return {
        ...state,
        projects: structuredData.projects,
        tasks: structuredData.tasks
      };
    }
    case LEGACY_KEYS.tasks: {
      const structuredData = ensureTasksGroupedIntoProject(
        reconcileTaskProjects(
          normalizeTaskCollection(value, []),
          state.projects
        ),
        state.projects
      );

      return {
        ...state,
        projects: structuredData.projects,
        tasks: structuredData.tasks,
        history: normalizeHistory(state.history, structuredData.tasks)
      };
    }
    case LEGACY_KEYS.dayPlan:
      return {
        ...state,
        dayPlan: normalizeDayPlanState(value)
      };
    case LEGACY_KEYS.execution:
      return {
        ...state,
        execution: normalizeExecutionState(value)
      };
    case LEGACY_KEYS.session:
      return {
        ...state,
        currentSession: normalizeSession(value, state.settings)
      };
    case LEGACY_KEYS.history:
      return {
        ...state,
        history: normalizeHistory(value, state.tasks)
      };
    default:
      return state;
  }
}

function getManagedSlice(state, key) {
  switch (key) {
    case LEGACY_KEYS.settings:
      return state.settings;
    case LEGACY_KEYS.projects:
      return state.projects;
    case LEGACY_KEYS.tasks:
      return state.tasks;
    case LEGACY_KEYS.dayPlan:
      return state.dayPlan;
    case LEGACY_KEYS.execution:
      return state.execution;
    case LEGACY_KEYS.session:
      return state.currentSession;
    case LEGACY_KEYS.history:
      return state.history;
    default:
      return undefined;
  }
}

function isManagedSliceKey(key) {
  return MANAGED_KEYS.has(key);
}

function persistNormalizedState(state) {
  writeJson(APP_STATE_KEY, state);
  syncLegacyKeys(state);
}

function syncLegacyKeys(state) {
  writeJson(LEGACY_KEYS.settings, state.settings);
  writeJson(LEGACY_KEYS.projects, state.projects);
  writeJson(LEGACY_KEYS.tasks, state.tasks);
  writeJson(LEGACY_KEYS.dayPlan, state.dayPlan);
  writeJson(LEGACY_KEYS.execution, state.execution);
  writeJson(LEGACY_KEYS.session, stripSessionArtifacts(state.currentSession));
  writeJson(LEGACY_KEYS.history, state.history);
}

function stripSessionArtifacts(session) {
  return { ...session };
}

function readJson(key, fallbackValue) {
  try {
    const rawValue = window.localStorage.getItem(key);
    return rawValue ? JSON.parse(rawValue) : fallbackValue;
  } catch (error) {
    console.error(`Falha ao ler ${key} do localStorage.`, error);
    return fallbackValue;
  }
}

function writeJson(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Falha ao salvar ${key} no localStorage.`, error);
  }
}

function resolveRecoveredSlice(primaryValue, legacyValue) {
  if (primaryValue !== null && primaryValue !== undefined) {
    const primaryIsEmptyArray = Array.isArray(primaryValue) && primaryValue.length === 0;
    const legacyHasData = Array.isArray(legacyValue) && legacyValue.length > 0;

    if (primaryIsEmptyArray && legacyHasData) {
      return legacyValue;
    }

    return primaryValue;
  }

  return legacyValue;
}

function extractBackupState(payload) {
  const candidate = isPlainObject(payload?.state)
    ? payload.state
    : payload;

  if (!isStateLike(candidate)) {
    throw new Error("Formato de backup invalido.");
  }

  return candidate;
}

function isStateLike(value) {
  if (!isPlainObject(value)) {
    return false;
  }

  const knownKeys = [
    "version",
    "settings",
    "projects",
    "tasks",
    "dayPlan",
    "execution",
    "currentSession",
    "history"
  ];

  return knownKeys.some((key) => Object.prototype.hasOwnProperty.call(value, key));
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getPhaseCounterKey(phaseId) {
  switch (phaseId) {
    case "focus":
      return "completedFocusSessions";
    case "micro":
      return "completedMicroPauses";
    case "long":
      return "completedLongBreaks";
    default:
      return "";
  }
}

function getPhaseDuration(phaseId, settings) {
  switch (phaseId) {
    case "micro":
      return settings.microBreakMinutes * 60;
    case "long":
      return settings.longBreakMinutes * 60;
    default:
      return settings.focusMinutes * 60;
  }
}

function getPhaseLabel(phaseId) {
  switch (phaseId) {
    case "micro":
      return "Micro pausa";
    case "long":
      return "Pausa longa";
    default:
      return "Sessao de foco";
  }
}

function normalizePhaseId(phaseId) {
  return ["focus", "micro", "long"].includes(phaseId) ? phaseId : "focus";
}

function normalizeSessionStatus(status) {
  return ["idle", "running", "paused"].includes(status) ? status : "idle";
}

function normalizeNullableString(value) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeDayPlanKind(kind) {
  return ["standalone", "task", "subtask"].includes(kind) ? kind : "standalone";
}

function normalizeDayPlanPriority(priority) {
  return ["A", "M", "B"].includes(priority) ? priority : "M";
}

function normalizeDayPlanTitle(title) {
  return typeof title === "string" && title.trim()
    ? title.trim()
    : "Item do plano do dia";
}

function normalizeExecutionMode(mode) {
  return ["solo", "meeting"].includes(mode) ? mode : "solo";
}

function normalizeOptionalPositiveInteger(value) {
  const numericValue = Number(value);
  if (!Number.isInteger(numericValue) || numericValue <= 0) {
    return null;
  }

  return numericValue;
}

function normalizeBoolean(value, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

function normalizeTextBlock(value) {
  return typeof value === "string" ? value.trim() : "";
}

function sanitizeInteger(value, fallback, min, max = Number.MAX_SAFE_INTEGER) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, Math.round(numericValue)));
}

function createTimestamp() {
  return new Date().toISOString();
}

function createDayPlanId() {
  const stamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 8);
  return `day-plan-${stamp}-${random}`;
}

function reconcileTaskProjects(tasks, projects) {
  const availableProjectIds = new Set(projects.map((project) => project.id));

  return tasks.map((task) => ({
    ...task,
    projectId: task.projectId && availableProjectIds.has(task.projectId)
      ? task.projectId
      : null
  }));
}

const EXECUTION_ACTIONS = [
  "email",
  "phone-call",
  "meeting",
  "reading",
  "writing",
  "document-send",
  "visit",
  "experimental-practice"
];

function getTodayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
