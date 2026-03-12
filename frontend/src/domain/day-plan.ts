import type { DayPlanItem, DayPlanItemId, DayPlanState, Priority, Task } from "./types";

const PRIORITIES: Priority[] = ["A", "M", "B"];

function normalizeDayPlanTitle(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function sanitizePriority(value: unknown): Priority {
  return PRIORITIES.includes(value as Priority) ? (value as Priority) : "M";
}

export function createDefaultDayPlanState(): DayPlanState {
  return {
    items: [],
    activeItemId: null
  };
}

export function createStandaloneDayPlanItem(title: string, priority: Priority): DayPlanItem {
  return {
    id: crypto.randomUUID(),
    kind: "standalone",
    title: normalizeDayPlanTitle(title) || "Item avulso",
    priority: sanitizePriority(priority),
    completed: false,
    createdAt: new Date().toISOString()
  };
}

export function createLinkedDayPlanItem(tasks: Task[], sourceValue: string, priority: Priority): DayPlanItem | null {
  const [kind, taskId, subtaskId] = sourceValue.split(":");

  if (kind === "task" && taskId) {
    const task = tasks.find((entry) => entry.id === taskId);
    if (!task) {
      return null;
    }

    return {
      id: crypto.randomUUID(),
      kind: "task",
      title: task.title,
      priority: sanitizePriority(priority),
      completed: task.completed,
      sourceTaskId: task.id,
      sourceSubtaskId: null,
      createdAt: new Date().toISOString()
    };
  }

  if (kind === "subtask" && taskId && subtaskId) {
    const task = tasks.find((entry) => entry.id === taskId);
    const subtask = task?.subtasks.find((entry) => entry.id === subtaskId);
    if (!task || !subtask) {
      return null;
    }

    return {
      id: crypto.randomUUID(),
      kind: "subtask",
      title: subtask.title,
      priority: sanitizePriority(priority),
      completed: subtask.completed,
      sourceTaskId: task.id,
      sourceSubtaskId: subtask.id,
      createdAt: new Date().toISOString()
    };
  }

  return null;
}

export function removeDayPlanItem(dayPlan: DayPlanState, itemId: DayPlanItemId): DayPlanState {
  return {
    ...dayPlan,
    items: dayPlan.items.filter((item) => item.id !== itemId),
    activeItemId: dayPlan.activeItemId === itemId ? null : dayPlan.activeItemId
  };
}

export function normalizeDayPlanState(value?: Partial<DayPlanState> | null): DayPlanState {
  if (!value || !Array.isArray(value.items)) {
    return createDefaultDayPlanState();
  }

  const items = value.items.reduce<DayPlanItem[]>((accumulator, item) => {
    const title = normalizeDayPlanTitle(item?.title);
    const id = typeof item?.id === "string" && item.id.trim().length > 0 ? item.id : crypto.randomUUID();
    const createdAt = typeof item?.createdAt === "string" && item.createdAt.trim().length > 0
      ? item.createdAt
      : new Date().toISOString();

    if (item?.kind === "standalone") {
      accumulator.push({
        id,
        kind: "standalone" as const,
        title: title || "Item avulso",
        priority: sanitizePriority(item.priority),
        completed: item.completed === true,
        createdAt
      });
      return accumulator;
    }

    if (item?.kind === "task" && typeof item.sourceTaskId === "string" && item.sourceTaskId.trim().length > 0) {
      accumulator.push({
        id,
        kind: "task" as const,
        title: title || "Tarefa vinculada",
        priority: sanitizePriority(item.priority),
        completed: item.completed === true,
        sourceTaskId: item.sourceTaskId,
        sourceSubtaskId: null,
        createdAt
      });
      return accumulator;
    }

    if (
      item?.kind === "subtask" &&
      typeof item.sourceTaskId === "string" &&
      item.sourceTaskId.trim().length > 0 &&
      typeof item.sourceSubtaskId === "string" &&
      item.sourceSubtaskId.trim().length > 0
    ) {
      accumulator.push({
        id,
        kind: "subtask" as const,
        title: title || "Subtarefa vinculada",
        priority: sanitizePriority(item.priority),
        completed: item.completed === true,
        sourceTaskId: item.sourceTaskId,
        sourceSubtaskId: item.sourceSubtaskId,
        createdAt
      });
      return accumulator;
    }

    return accumulator;
  }, []);

  const activeItemId = typeof value.activeItemId === "string" && items.some((item) => item.id === value.activeItemId)
    ? value.activeItemId
    : null;

  return {
    items,
    activeItemId
  };
}

export function setActiveDayPlanItem(dayPlan: DayPlanState, itemId: DayPlanItemId): DayPlanState {
  return {
    ...dayPlan,
    activeItemId: dayPlan.items.some((item) => item.id === itemId) ? itemId : null
  };
}

export function clearActiveDayPlanItem(dayPlan: DayPlanState): DayPlanState {
  if (dayPlan.activeItemId === null) {
    return dayPlan;
  }

  return {
    ...dayPlan,
    activeItemId: null
  };
}
