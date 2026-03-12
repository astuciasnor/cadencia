import { PROVISIONAL_PROJECT_ID } from "./constants";
import type { CognitiveProfile, Project, ProjectId, Subtask, Task } from "./types";

function normalizeTimestamp(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function normalizeBoolean(value: unknown, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

function sanitizeCognitiveValue(value: unknown): 1 | 2 | 3 | 4 | 5 | null {
  return value === 1 || value === 2 || value === 3 || value === 4 || value === 5 ? value : null;
}

export function createDefaultCognitiveProfile(): CognitiveProfile {
  return {
    startEase: null,
    anxietyLevel: null,
    perceivedLoad: null
  };
}

export function createTask(title: string, projectId: ProjectId = PROVISIONAL_PROJECT_ID): Task {
  return {
    id: crypto.randomUUID(),
    projectId,
    title: normalizeTaskTitle(title) || "Tarefa sem nome",
    completed: false,
    completedAt: null,
    isFocus: false,
    nextStepNote: "",
    cognitiveProfile: createDefaultCognitiveProfile(),
    subtasks: []
  };
}

export function createSubtask(title: string, minutes = 15): Subtask {
  return {
    id: crypto.randomUUID(),
    title: normalizeTaskTitle(title) || "Subtarefa sem nome",
    minutes: sanitizeMinutes(minutes),
    completed: false,
    completedAt: null,
    isFocus: false,
    nextStepNote: "",
    cognitiveProfile: createDefaultCognitiveProfile()
  };
}

export function normalizeTaskTitle(value: string) {
  return typeof value === "string" ? value.trim() : "";
}

export function sanitizeMinutes(value: number | string, fallback = 15) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }

  return Math.min(240, Math.max(1, Math.round(numeric)));
}

export function ensureTasksGroupedIntoProject(tasks: Task[], projects: Project[]) {
  const validProjectIds = new Set(projects.map((project) => project.id));
  return tasks.map((task) => ({
    ...task,
    projectId: validProjectIds.has(task.projectId) ? task.projectId : PROVISIONAL_PROJECT_ID
  }));
}

export function clearFocus(taskItems: Task[]) {
  return taskItems.map((task) => ({
    ...task,
    isFocus: false,
    subtasks: task.subtasks.map((subtask) => ({
      ...subtask,
      isFocus: false
    }))
  }));
}

export function setTaskFocus(taskItems: Task[], taskId: string) {
  return clearFocus(taskItems).map((task) => ({
    ...task,
    isFocus: task.id === taskId
  }));
}

export function setSubtaskFocus(taskItems: Task[], taskId: string, subtaskId: string) {
  return clearFocus(taskItems).map((task) => ({
    ...task,
    isFocus: false,
    subtasks: task.subtasks.map((subtask) => ({
      ...subtask,
      isFocus: task.id === taskId && subtask.id === subtaskId
    }))
  }));
}

export function hydrateCognitiveProfile(value: Partial<CognitiveProfile> | null | undefined): CognitiveProfile {
  return {
    startEase: sanitizeCognitiveValue(value?.startEase),
    anxietyLevel: sanitizeCognitiveValue(value?.anxietyLevel),
    perceivedLoad: sanitizeCognitiveValue(value?.perceivedLoad)
  };
}

export function hydrateSubtask(value: Partial<Subtask> | null | undefined): Subtask {
  return {
    id: typeof value?.id === "string" && value.id.trim().length > 0 ? value.id : crypto.randomUUID(),
    title: normalizeTaskTitle(value?.title ?? "") || "Subtarefa sem nome",
    minutes: sanitizeMinutes(value?.minutes ?? 15),
    completed: normalizeBoolean(value?.completed),
    completedAt: normalizeTimestamp(value?.completedAt),
    isFocus: normalizeBoolean(value?.isFocus),
    nextStepNote: typeof value?.nextStepNote === "string" ? value.nextStepNote.trim() : "",
    cognitiveProfile: hydrateCognitiveProfile(value?.cognitiveProfile)
  };
}

export function hydrateTask(value: Partial<Task> | null | undefined): Task {
  return {
    id: typeof value?.id === "string" && value.id.trim().length > 0 ? value.id : crypto.randomUUID(),
    projectId: typeof value?.projectId === "string" && value.projectId.trim().length > 0
      ? value.projectId
      : PROVISIONAL_PROJECT_ID,
    title: normalizeTaskTitle(value?.title ?? "") || "Tarefa sem nome",
    completed: normalizeBoolean(value?.completed),
    completedAt: normalizeTimestamp(value?.completedAt),
    isFocus: normalizeBoolean(value?.isFocus),
    nextStepNote: typeof value?.nextStepNote === "string" ? value.nextStepNote.trim() : "",
    cognitiveProfile: hydrateCognitiveProfile(value?.cognitiveProfile),
    subtasks: Array.isArray(value?.subtasks) ? value.subtasks.map((subtask) => hydrateSubtask(subtask)) : []
  };
}

export function hydrateTasks(value: Partial<Task>[] | null | undefined, projects: Project[]): Task[] {
  const taskItems = Array.isArray(value) ? value.map((task) => hydrateTask(task)) : [];
  return ensureTasksGroupedIntoProject(taskItems, projects);
}
