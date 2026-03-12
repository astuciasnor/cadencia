export function resolveCurrentFocus({ taskSummary, dayPlan }) {
  const standaloneDayPlanFocus = getStandaloneDayPlanFocus(dayPlan);
  if (standaloneDayPlanFocus) {
    return createStandaloneFocusEntry(standaloneDayPlanFocus);
  }

  const taskFocus = taskSummary?.focus;
  if (!taskFocus) {
    return null;
  }

  return createTaskFocusEntry(taskFocus);
}

export function getStandaloneDayPlanFocus(dayPlan) {
  if (!dayPlan?.activeItemId || !Array.isArray(dayPlan.items)) {
    return null;
  }

  const activeItem = dayPlan.items.find((item) => item.id === dayPlan.activeItemId) ?? null;
  return activeItem?.kind === "standalone"
    ? activeItem
    : null;
}

export function getFocusKey(currentFocus) {
  if (!currentFocus) {
    return "";
  }

  if (currentFocus.kind === "standalone" && currentFocus.dayPlanItemId) {
    return `standalone:${currentFocus.dayPlanItemId}`;
  }

  if (currentFocus.kind === "subtask" && currentFocus.sourceTaskId && currentFocus.sourceSubtaskId) {
    return `subtask:${currentFocus.sourceTaskId}:${currentFocus.sourceSubtaskId}`;
  }

  if ((currentFocus.kind === "task" || currentFocus.kind === "subtask") && currentFocus.sourceTaskId) {
    return `task:${currentFocus.sourceTaskId}`;
  }

  return "";
}

function createStandaloneFocusEntry(item) {
  return {
    kind: "standalone",
    origin: "day-plan",
    dayPlanItemId: item.id,
    completed: item.completed,
    priority: item.priority,
    taskId: null,
    taskTitle: item.title,
    sourceTaskId: null,
    sourceSubtaskId: null,
    subtaskId: null,
    subtaskTitle: "Item avulso",
    minutes: null,
    label: item.title,
    description: `Item avulso do plano do dia - prioridade ${item.priority}`
  };
}

function createTaskFocusEntry(taskFocus) {
  return {
    ...taskFocus,
    kind: taskFocus.subtaskId ? "subtask" : "task",
    origin: "projects",
    sourceTaskId: taskFocus.taskId,
    sourceSubtaskId: taskFocus.subtaskId
  };
}
