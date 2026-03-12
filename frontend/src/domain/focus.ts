import type { CurrentFocus, DayPlanState, Task } from "./types";

export function resolveCurrentFocus(taskItems: Task[], dayPlan: DayPlanState): CurrentFocus {
  const standaloneFocus = getStandaloneDayPlanFocus(dayPlan);
  if (standaloneFocus) {
    return {
      kind: "standalone",
      origin: "day-plan",
      dayPlanItemId: standaloneFocus.id,
      taskId: null,
      subtaskId: null,
      sourceTaskId: null,
      sourceSubtaskId: null,
      label: standaloneFocus.title,
      description: `Item avulso do plano do dia · prioridade ${standaloneFocus.priority}`
    };
  }

  for (const task of taskItems) {
    const focusedSubtask = task.subtasks.find((subtask) => subtask.isFocus);
    if (focusedSubtask) {
      return {
        kind: "subtask",
        origin: "projects",
        sourceTaskId: task.id,
        sourceSubtaskId: focusedSubtask.id,
        taskId: task.id,
        subtaskId: focusedSubtask.id,
        label: focusedSubtask.title,
        description: `${task.title} · ${focusedSubtask.minutes} min de referência`,
        minutes: focusedSubtask.minutes
      };
    }

    if (task.isFocus) {
      return {
        kind: "task",
        origin: "projects",
        sourceTaskId: task.id,
        sourceSubtaskId: null,
        taskId: task.id,
        subtaskId: null,
        label: task.title,
        description: "Tarefa em foco"
      };
    }
  }

  return null;
}

export function getStandaloneDayPlanFocus(dayPlan: DayPlanState) {
  if (!dayPlan.activeItemId) {
    return null;
  }

  const item = dayPlan.items.find((entry) => entry.id === dayPlan.activeItemId) ?? null;
  return item?.kind === "standalone" ? item : null;
}

export function getFocusKey(currentFocus: CurrentFocus): string {
  if (!currentFocus) {
    return "";
  }

  if (currentFocus.kind === "standalone") {
    return `standalone:${currentFocus.dayPlanItemId}`;
  }

  if (currentFocus.kind === "subtask") {
    return `subtask:${currentFocus.sourceTaskId}:${currentFocus.sourceSubtaskId}`;
  }

  return `task:${currentFocus.sourceTaskId}`;
}
