import { create } from "zustand";
import type { AppTabId } from "@/app/navigation";
import { clearCurrentFocus, createDefaultAppState, setFocusedStandaloneDayPlanItem as applyFocusedStandaloneDayPlanItem, setFocusedSubtask as applyFocusedSubtask, setFocusedTask as applyFocusedTask } from "@/domain/app-state";
import { createLinkedDayPlanItem, createStandaloneDayPlanItem, removeDayPlanItem as removeDayPlanItemFromState, sanitizePriority } from "@/domain/day-plan";
import { getFocusKey } from "@/domain/focus";
import type { AppState, ExecutionEntry } from "@/domain/types";
import { localStorageAppStateAdapter } from "@/adapters/local-storage/app-state-adapter";
import { PROVISIONAL_PROJECT_ID } from "@/domain/constants";
import { createDefaultExecutionEntry } from "@/domain/execution";
import { createProject, normalizeProjectColor, normalizeProjectTitle } from "@/domain/projects";
import { createSubtask, createTask, normalizeTaskTitle, sanitizeMinutes } from "@/domain/tasks";
import { advanceTimerSession, pauseTimerSession, resetTimerSession, sanitizeTimerSettings, startTimerSession, tickTimerSession } from "@/domain/timer";

interface AppUiState {
  activeTab: AppTabId;
  isHydrated: boolean;
}

export interface AppStoreShape {
  ui: AppUiState;
  state: AppState;
  hydrate: () => void;
  resetState: () => void;
  setActiveTab: (tab: AppTabId) => void;
  replaceState: (nextState: AppState) => void;
  updateState: (updater: (state: AppState) => AppState) => void;
  addProject: (title: string, color?: string) => void;
  updateProject: (projectId: string, updates: { title?: string; color?: string }) => void;
  removeProject: (projectId: string) => void;
  addTask: (projectId: string, title: string) => void;
  updateTask: (taskId: string, updates: { title?: string; projectId?: string }) => void;
  removeTask: (taskId: string) => void;
  toggleTaskCompleted: (taskId: string) => void;
  addSubtask: (taskId: string, title: string, minutes?: number) => void;
  updateSubtask: (taskId: string, subtaskId: string, updates: { title?: string; minutes?: number }) => void;
  moveSubtask: (taskId: string, subtaskId: string, targetTaskId: string) => void;
  removeSubtask: (taskId: string, subtaskId: string) => void;
  toggleSubtaskCompleted: (taskId: string, subtaskId: string) => void;
  setFocusedTask: (taskId: string) => void;
  setFocusedSubtask: (taskId: string, subtaskId: string) => void;
  clearFocusedItem: () => void;
  updateFocusedWork: (updates: {
    title?: string;
    minutes?: number;
    nextStepNote?: string;
    startEase?: 1 | 2 | 3 | 4 | 5 | null;
    anxietyLevel?: 1 | 2 | 3 | 4 | 5 | null;
    perceivedLoad?: 1 | 2 | 3 | 4 | 5 | null;
  }) => void;
  updateFocusedExecution: (updates: Partial<ExecutionEntry>) => void;
  updateTimerSettings: (updates: Partial<AppState["settings"]>) => void;
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  skipTimerPhase: () => void;
  tickTimer: () => void;
  addStandaloneDayPlanItem: (title: string, priority: "A" | "M" | "B") => void;
  addLinkedDayPlanItem: (sourceValue: string, priority: "A" | "M" | "B") => void;
  removeDayPlanItem: (itemId: string) => void;
  toggleDayPlanItemCompleted: (itemId: string) => void;
  setDayPlanItemFocus: (itemId: string) => void;
}

function persistState(nextState: AppState) {
  return localStorageAppStateAdapter.save(nextState);
}

function getHistoryKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export const useAppStore = create<AppStoreShape>((set) => ({
  ui: {
    activeTab: "timer",
    isHydrated: false
  },
  state: createDefaultAppState(),

  hydrate() {
    const state = localStorageAppStateAdapter.load();
    set((current) => ({
      state,
      ui: {
        ...current.ui,
        isHydrated: true
      }
    }));
  },

  resetState() {
    const state = localStorageAppStateAdapter.reset();
    set((current) => ({
      state,
      ui: {
        ...current.ui
      }
    }));
  },

  setActiveTab(tab) {
    set((current) => ({
      ui: {
        ...current.ui,
        activeTab: tab
      }
    }));
  },

  replaceState(nextState) {
    set((current) => ({
      state: persistState(nextState),
      ui: {
        ...current.ui,
        isHydrated: true
      }
    }));
  },

  updateState(updater) {
    set((current) => ({
      state: persistState(updater(current.state)),
      ui: {
        ...current.ui,
        isHydrated: true
      }
    }));
  },

  addProject(title, color) {
    set((current) => ({
      state: persistState({
        ...current.state,
        projects: [...current.state.projects, createProject(title, color)]
      }),
      ui: {
        ...current.ui,
        isHydrated: true
      }
    }));
  },

  updateProject(projectId, updates) {
    set((current) => ({
      state: persistState({
        ...current.state,
        projects: current.state.projects.map((project) => {
          if (project.id !== projectId) {
            return project;
          }

          return {
            ...project,
            title: updates.title !== undefined
              ? normalizeProjectTitle(updates.title) || project.title
              : project.title,
            color: updates.color !== undefined
              ? normalizeProjectColor(updates.color)
              : project.color,
            updatedAt: new Date().toISOString()
          };
        })
      }),
      ui: {
        ...current.ui,
        isHydrated: true
      }
    }));
  },

  removeProject(projectId) {
    if (projectId === PROVISIONAL_PROJECT_ID) {
      return;
    }

    set((current) => ({
      state: persistState({
        ...current.state,
        projects: current.state.projects.filter((project) => project.id !== projectId),
        tasks: current.state.tasks.map((task) => ({
          ...task,
          projectId: task.projectId === projectId ? PROVISIONAL_PROJECT_ID : task.projectId
        }))
      }),
      ui: {
        ...current.ui,
        isHydrated: true
      }
    }));
  },

  addTask(projectId, title) {
    set((current) => ({
      state: persistState({
        ...current.state,
        tasks: [...current.state.tasks, createTask(title, projectId)]
      }),
      ui: {
        ...current.ui,
        isHydrated: true
      }
    }));
  },

  updateTask(taskId, updates) {
    set((current) => ({
      state: persistState({
        ...current.state,
        tasks: current.state.tasks.map((task) => {
          if (task.id !== taskId) {
            return task;
          }

          return {
            ...task,
            title: updates.title !== undefined ? normalizeTaskTitle(updates.title) || task.title : task.title,
            projectId: updates.projectId ?? task.projectId
          };
        })
      }),
      ui: {
        ...current.ui,
        isHydrated: true
      }
    }));
  },

  removeTask(taskId) {
    set((current) => ({
      state: persistState({
        ...current.state,
        tasks: current.state.tasks.filter((task) => task.id !== taskId)
      }),
      ui: {
        ...current.ui,
        isHydrated: true
      }
    }));
  },

  toggleTaskCompleted(taskId) {
    set((current) => ({
      state: persistState({
        ...current.state,
        tasks: current.state.tasks.map((task) => (
          task.id === taskId
            ? {
                ...task,
                completed: !task.completed,
                completedAt: task.completed ? null : new Date().toISOString()
              }
            : task
        ))
      }),
      ui: {
        ...current.ui,
        isHydrated: true
      }
    }));
  },

  addSubtask(taskId, title, minutes = 15) {
    set((current) => ({
      state: persistState({
        ...current.state,
        tasks: current.state.tasks.map((task) => (
          task.id === taskId
            ? {
                ...task,
                subtasks: [...task.subtasks, createSubtask(title, minutes)]
              }
            : task
        ))
      }),
      ui: {
        ...current.ui,
        isHydrated: true
      }
    }));
  },

  updateSubtask(taskId, subtaskId, updates) {
    set((current) => ({
      state: persistState({
        ...current.state,
        tasks: current.state.tasks.map((task) => (
          task.id === taskId
            ? {
                ...task,
                subtasks: task.subtasks.map((subtask) => (
                  subtask.id === subtaskId
                    ? {
                        ...subtask,
                        title: updates.title !== undefined
                          ? normalizeTaskTitle(updates.title) || subtask.title
                          : subtask.title,
                        minutes: updates.minutes !== undefined
                          ? sanitizeMinutes(updates.minutes, subtask.minutes)
                          : subtask.minutes
                      }
                    : subtask
                ))
              }
            : task
        ))
      }),
      ui: {
        ...current.ui,
        isHydrated: true
      }
    }));
  },

  moveSubtask(taskId, subtaskId, targetTaskId) {
    if (taskId === targetTaskId) {
      return;
    }

    set((current) => {
      const sourceTask = current.state.tasks.find((task) => task.id === taskId);
      const subtaskToMove = sourceTask?.subtasks.find((subtask) => subtask.id === subtaskId);

      if (!sourceTask || !subtaskToMove || !current.state.tasks.some((task) => task.id === targetTaskId)) {
        return current;
      }

      return {
        state: persistState({
          ...current.state,
          tasks: current.state.tasks.map((task) => {
            if (task.id === taskId) {
              return {
                ...task,
                subtasks: task.subtasks.filter((subtask) => subtask.id !== subtaskId)
              };
            }

            if (task.id === targetTaskId) {
              return {
                ...task,
                subtasks: [...task.subtasks, subtaskToMove]
              };
            }

            return task;
          })
        }),
        ui: {
          ...current.ui,
          isHydrated: true
        }
      };
    });
  },

  removeSubtask(taskId, subtaskId) {
    set((current) => ({
      state: persistState({
        ...current.state,
        tasks: current.state.tasks.map((task) => (
          task.id === taskId
            ? {
                ...task,
                subtasks: task.subtasks.filter((subtask) => subtask.id !== subtaskId)
              }
            : task
        ))
      }),
      ui: {
        ...current.ui,
        isHydrated: true
      }
    }));
  },

  toggleSubtaskCompleted(taskId, subtaskId) {
    set((current) => ({
      state: persistState({
        ...current.state,
        tasks: current.state.tasks.map((task) => (
          task.id === taskId
            ? {
                ...task,
                subtasks: task.subtasks.map((subtask) => (
                  subtask.id === subtaskId
                    ? {
                        ...subtask,
                        completed: !subtask.completed,
                        completedAt: subtask.completed ? null : new Date().toISOString()
                      }
                    : subtask
                ))
              }
            : task
        ))
      }),
      ui: {
        ...current.ui,
        isHydrated: true
      }
    }));
  },

  setFocusedTask(taskId) {
    set((current) => ({
      state: persistState(applyFocusedTask(current.state, taskId)),
      ui: {
        ...current.ui,
        isHydrated: true
      }
    }));
  },

  setFocusedSubtask(taskId, subtaskId) {
    set((current) => ({
      state: persistState(applyFocusedSubtask(current.state, taskId, subtaskId)),
      ui: {
        ...current.ui,
        isHydrated: true
      }
    }));
  },

  clearFocusedItem() {
    set((current) => ({
      state: persistState(clearCurrentFocus(current.state)),
      ui: {
        ...current.ui,
        isHydrated: true
      }
    }));
  },

  updateFocusedWork(updates) {
    set((current) => {
      const currentFocus = current.state.currentFocus;
      if (!currentFocus) {
        return current;
      }

      return {
        state: persistState({
          ...current.state,
          tasks: current.state.tasks.map((task) => {
            if (currentFocus.kind === "task" && task.id === currentFocus.taskId) {
              return {
                ...task,
                title: updates.title !== undefined ? normalizeTaskTitle(updates.title) || task.title : task.title,
                nextStepNote: updates.nextStepNote !== undefined ? updates.nextStepNote.trim() : task.nextStepNote,
                cognitiveProfile: {
                  startEase: updates.startEase !== undefined ? updates.startEase : task.cognitiveProfile.startEase,
                  anxietyLevel: updates.anxietyLevel !== undefined ? updates.anxietyLevel : task.cognitiveProfile.anxietyLevel,
                  perceivedLoad: updates.perceivedLoad !== undefined
                    ? updates.perceivedLoad
                    : task.cognitiveProfile.perceivedLoad
                }
              };
            }

            if (currentFocus.kind === "subtask" && task.id === currentFocus.taskId) {
              return {
                ...task,
                subtasks: task.subtasks.map((subtask) => (
                  subtask.id === currentFocus.subtaskId
                    ? {
                        ...subtask,
                        title: updates.title !== undefined
                          ? normalizeTaskTitle(updates.title) || subtask.title
                          : subtask.title,
                        minutes: updates.minutes !== undefined
                          ? sanitizeMinutes(updates.minutes, subtask.minutes)
                          : subtask.minutes,
                        nextStepNote: updates.nextStepNote !== undefined
                          ? updates.nextStepNote.trim()
                          : subtask.nextStepNote,
                        cognitiveProfile: {
                          startEase: updates.startEase !== undefined
                            ? updates.startEase
                            : subtask.cognitiveProfile.startEase,
                          anxietyLevel: updates.anxietyLevel !== undefined
                            ? updates.anxietyLevel
                            : subtask.cognitiveProfile.anxietyLevel,
                          perceivedLoad: updates.perceivedLoad !== undefined
                            ? updates.perceivedLoad
                            : subtask.cognitiveProfile.perceivedLoad
                        }
                      }
                    : subtask
                ))
              };
            }

            return task;
          })
        }),
        ui: {
          ...current.ui,
          isHydrated: true
        }
      };
    });
  },

  updateFocusedExecution(updates) {
    set((current) => {
      const focusKey = getFocusKey(current.state.currentFocus);
      if (!focusKey) {
        return current;
      }

      const entry = current.state.execution[focusKey] ?? createDefaultExecutionEntry();

      return {
        state: persistState({
          ...current.state,
          execution: {
            ...current.state.execution,
            [focusKey]: {
              ...entry,
              ...updates,
              updatedAt: new Date().toISOString()
            }
          }
        }),
        ui: {
          ...current.ui,
          isHydrated: true
        }
      };
    });
  },

  updateTimerSettings(updates) {
    set((current) => {
      const settings = sanitizeTimerSettings({
        ...current.state.settings,
        ...updates
      });
      const currentSession = current.state.currentSession.status === "idle"
        ? resetTimerSession(settings, current.state.currentSession)
        : {
            ...current.state.currentSession,
            nextFocusDurationSeconds: settings.focusMinutes * 60
          };

      return {
        state: persistState({
          ...current.state,
          settings,
          currentSession
        }),
        ui: {
          ...current.ui,
          isHydrated: true
        }
      };
    });
  },

  startTimer() {
    set((current) => ({
      state: persistState({
        ...current.state,
        currentSession: startTimerSession(current.state.currentSession)
      }),
      ui: {
        ...current.ui,
        isHydrated: true
      }
    }));
  },

  pauseTimer() {
    set((current) => ({
      state: persistState({
        ...current.state,
        currentSession: pauseTimerSession(current.state.currentSession)
      }),
      ui: {
        ...current.ui,
        isHydrated: true
      }
    }));
  },

  resetTimer() {
    set((current) => ({
      state: persistState({
        ...current.state,
        currentSession: resetTimerSession(current.state.settings, current.state.currentSession)
      }),
      ui: {
        ...current.ui,
        isHydrated: true
      }
    }));
  },

  skipTimerPhase() {
    set((current) => ({
      state: persistState({
        ...current.state,
        currentSession: advanceTimerSession(current.state.currentSession, current.state.settings)
      }),
      ui: {
        ...current.ui,
        isHydrated: true
      }
    }));
  },

  tickTimer() {
    set((current) => {
      const tick = tickTimerSession(current.state.currentSession, current.state.settings);
      const historyKey = getHistoryKey();
      const historyEntry = current.state.history[historyKey] ?? {
        date: historyKey,
        completedFocusSessions: 0,
        completedMicroPauses: 0,
        completedLongBreaks: 0,
        focusedMinutes: 0,
        updatedAt: null
      };

      const history = tick.completedPhase
        ? {
            ...current.state.history,
            [historyKey]: {
              ...historyEntry,
              completedFocusSessions: historyEntry.completedFocusSessions + (tick.completedPhase === "focus" ? 1 : 0),
              completedMicroPauses: historyEntry.completedMicroPauses + (tick.completedPhase === "micro" ? 1 : 0),
              completedLongBreaks: historyEntry.completedLongBreaks + (tick.completedPhase === "long" ? 1 : 0),
              focusedMinutes: historyEntry.focusedMinutes + (
                tick.completedPhase === "focus"
                  ? Math.round(current.state.currentSession.durationSeconds / 60)
                  : 0
              ),
              updatedAt: new Date().toISOString()
            }
          }
        : current.state.history;

      return {
        state: persistState({
          ...current.state,
          currentSession: tick.session,
          history
        }),
        ui: {
          ...current.ui,
          isHydrated: true
        }
      };
    });
  },

  addStandaloneDayPlanItem(title, priority) {
    set((current) => ({
      state: persistState({
        ...current.state,
        dayPlan: {
          ...current.state.dayPlan,
          items: [...current.state.dayPlan.items, createStandaloneDayPlanItem(title, sanitizePriority(priority))]
        }
      }),
      ui: {
        ...current.ui,
        isHydrated: true
      }
    }));
  },

  addLinkedDayPlanItem(sourceValue, priority) {
    set((current) => {
      const item = createLinkedDayPlanItem(current.state.tasks, sourceValue, sanitizePriority(priority));
      if (!item) {
        return current;
      }

      return {
        state: persistState({
          ...current.state,
          dayPlan: {
            ...current.state.dayPlan,
            items: [...current.state.dayPlan.items, item]
          }
        }),
        ui: {
          ...current.ui,
          isHydrated: true
        }
      };
    });
  },

  removeDayPlanItem(itemId) {
    set((current) => ({
      state: persistState({
        ...current.state,
        dayPlan: removeDayPlanItemFromState(current.state.dayPlan, itemId)
      }),
      ui: {
        ...current.ui,
        isHydrated: true
      }
    }));
  },

  toggleDayPlanItemCompleted(itemId) {
    set((current) => ({
      state: persistState({
        ...current.state,
        dayPlan: {
          ...current.state.dayPlan,
          items: current.state.dayPlan.items.map((item) => (
            item.id === itemId
              ? {
                  ...item,
                  completed: !item.completed
                }
              : item
          ))
        }
      }),
      ui: {
        ...current.ui,
        isHydrated: true
      }
    }));
  },

  setDayPlanItemFocus(itemId) {
    set((current) => {
      const selectedItem = current.state.dayPlan.items.find((item) => item.id === itemId);
      if (!selectedItem) {
        return current;
      }

      const state = selectedItem.kind === "standalone"
        ? applyFocusedStandaloneDayPlanItem(current.state, itemId)
        : selectedItem.kind === "task"
          ? applyFocusedTask(current.state, selectedItem.sourceTaskId)
          : applyFocusedSubtask(current.state, selectedItem.sourceTaskId, selectedItem.sourceSubtaskId);

      return {
        state: persistState(state),
        ui: {
          ...current.ui,
          isHydrated: true
        }
      };
    });
  }
}));
