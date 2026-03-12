export const PROJECT_COLOR_PALETTE = [
  "#7AA4FF",
  "#61C79D",
  "#FFBF78",
  "#BCA8FF",
  "#73BED0",
  "#F08A97",
  "#F4D35E",
  "#F7A072"
];

export const DEFAULT_PROJECT_COLOR = PROJECT_COLOR_PALETTE[0];
export const PROVISIONAL_PROJECT_ID = "project-unassigned";
export const PROVISIONAL_PROJECT_TITLE = "Sem projeto";
export const PROVISIONAL_PROJECT_COLOR = "#7C91BA";

export const DEFAULT_TASKS = [
  {
    id: "task-setup",
    title: "Planejar o dia",
    completed: false,
    isFocus: true,
    projectId: null,
    cognitiveProfile: createDefaultCognitiveProfile(),
    subtasks: [
      {
        id: "subtask-setup-1",
        title: "Definir prioridade principal",
        minutes: 20,
        completed: false,
        isFocus: true,
        cognitiveProfile: createDefaultCognitiveProfile()
      },
      {
        id: "subtask-setup-2",
        title: "Separar materiais de apoio",
        minutes: 10,
        completed: false,
        isFocus: false,
        cognitiveProfile: createDefaultCognitiveProfile()
      }
    ]
  },
  {
    id: "task-review",
    title: "Revisar entregas importantes",
    completed: false,
    isFocus: false,
    projectId: null,
    cognitiveProfile: createDefaultCognitiveProfile(),
    subtasks: [
      {
        id: "subtask-review-1",
        title: "Conferir pendencias do cliente",
        minutes: 25,
        completed: false,
        isFocus: false,
        cognitiveProfile: createDefaultCognitiveProfile()
      }
    ]
  }
];

export function normalizeProjectCollection(rawProjects, fallbackProjects = []) {
  const baseProjects = Array.isArray(rawProjects) ? rawProjects : fallbackProjects;
  const seenIds = new Set();

  return baseProjects
    .filter((project) => project && typeof project === "object")
    .map((project) => normalizeProject(project))
    .filter((project) => {
      if (seenIds.has(project.id)) {
        return false;
      }

      seenIds.add(project.id);
      return true;
    });
}

export function normalizeTaskCollection(rawTasks, fallbackTasks = []) {
  const baseTasks = Array.isArray(rawTasks) ? rawTasks : fallbackTasks;

  return enforceSingleFocus(
    baseTasks
      .filter((task) => task && typeof task === "object")
      .map((task) => deriveTaskState(normalizeTask(task)))
  );
}

export function summarizeTaskCollection(taskItems) {
  const total = taskItems.length;
  const completed = taskItems.filter((task) => task.completed).length;
  const totalSubtasks = taskItems.reduce((sum, task) => sum + task.subtasks.length, 0);
  const completedSubtasks = taskItems.reduce(
    (sum, task) => sum + task.subtasks.filter((subtask) => subtask.completed).length,
    0
  );

  return {
    total,
    completed,
    totalSubtasks,
    completedSubtasks,
    focus: getFocusedSelection(taskItems)
  };
}

export function buildTaskView(task) {
  const clonedTask = cloneTask(task);

  return {
    ...clonedTask,
    progress: getTaskProgress(clonedTask)
  };
}

export function createProject(title, color = null) {
  return {
    id: createId("project"),
    title,
    color: normalizeProjectColor(color, title),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

export function createProvisionalProject() {
  const timestamp = new Date().toISOString();

  return {
    id: PROVISIONAL_PROJECT_ID,
    title: PROVISIONAL_PROJECT_TITLE,
    color: PROVISIONAL_PROJECT_COLOR,
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

export function ensureTasksGroupedIntoProject(tasks, projects) {
  const normalizedProjects = normalizeProjectCollection(projects, []);
  const availableProjectIds = new Set(normalizedProjects.map((project) => project.id));
  const hasOrphanTasks = tasks.some((task) => !task.projectId || !availableProjectIds.has(task.projectId));

  if (!hasOrphanTasks) {
    return {
      projects: normalizedProjects,
      tasks
    };
  }

  const provisionalProject =
    normalizedProjects.find((project) => project.id === PROVISIONAL_PROJECT_ID) ??
    normalizedProjects.find(
      (project) => normalizeProjectTitle(project.title).toLowerCase() === PROVISIONAL_PROJECT_TITLE.toLowerCase()
    ) ??
    createProvisionalProject();

  const nextProjects = normalizedProjects.some((project) => project.id === provisionalProject.id)
    ? normalizedProjects
    : [provisionalProject, ...normalizedProjects];
  const nextProjectIds = new Set(nextProjects.map((project) => project.id));
  const nextTasks = tasks.map((task) => ({
    ...task,
    projectId: task.projectId && nextProjectIds.has(task.projectId)
      ? task.projectId
      : provisionalProject.id
  }));

  return {
    projects: nextProjects,
    tasks: nextTasks
  };
}

export function createTask(title, projectId = null) {
  return {
    id: createId("task"),
    title,
    completed: false,
    completedAt: null,
    isFocus: false,
    projectId: normalizeProjectId(projectId),
    nextStepNote: "",
    cognitiveProfile: createDefaultCognitiveProfile(),
    subtasks: []
  };
}

export function createSubtask(title, minutes) {
  return {
    id: createId("subtask"),
    title,
    minutes: sanitizeMinutes(minutes, 15),
    completed: false,
    completedAt: null,
    isFocus: false,
    nextStepNote: "",
    cognitiveProfile: createDefaultCognitiveProfile()
  };
}

export function createDefaultCognitiveProfile() {
  return {
    startEase: null,
    anxietyLevel: null,
    perceivedLoad: null
  };
}

export function normalizeTaskTitle(title) {
  return typeof title === "string" ? title.trim() : "";
}

export function normalizeTaskNote(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function normalizeProjectTitle(title) {
  return typeof title === "string" ? title.trim() : "";
}

export function sanitizeMinutes(value, fallback) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return fallback;
  }

  return Math.min(240, Math.max(1, Math.round(numericValue)));
}

function normalizeProject(project) {
  return {
    id: typeof project.id === "string" && project.id ? project.id : createId("project"),
    title: normalizeProjectTitle(project.title) || "Projeto sem nome",
    color: normalizeProjectColor(project.color, project.title),
    createdAt: normalizeNullableString(project.createdAt) || new Date().toISOString(),
    updatedAt: normalizeNullableString(project.updatedAt) || normalizeNullableString(project.createdAt) || new Date().toISOString()
  };
}

function normalizeTask(task) {
  return {
    id: typeof task.id === "string" && task.id ? task.id : createId("task"),
    title: normalizeTaskTitle(task.title) || "Tarefa sem nome",
    completed: Boolean(task.completed),
    completedAt: normalizeNullableString(task.completedAt),
    isFocus: Boolean(task.isFocus),
    projectId: normalizeProjectId(task.projectId),
    nextStepNote: normalizeTaskNote(task.nextStepNote),
    cognitiveProfile: normalizeCognitiveProfile(task.cognitiveProfile),
    subtasks: Array.isArray(task.subtasks)
      ? task.subtasks
          .filter((subtask) => subtask && typeof subtask === "object")
          .map((subtask) => ({
            id: typeof subtask.id === "string" && subtask.id ? subtask.id : createId("subtask"),
            title: normalizeTaskTitle(subtask.title) || "Subtarefa sem nome",
            minutes: sanitizeMinutes(subtask.minutes, 15),
            completed: Boolean(subtask.completed),
            completedAt: normalizeNullableString(subtask.completedAt),
            isFocus: Boolean(subtask.isFocus),
            nextStepNote: normalizeTaskNote(subtask.nextStepNote),
            cognitiveProfile: normalizeCognitiveProfile(subtask.cognitiveProfile)
          }))
      : []
  };
}

function deriveTaskState(task) {
  const subtasks = task.subtasks.map((subtask) => ({ ...subtask }));
  const completed = subtasks.length > 0
    ? subtasks.every((subtask) => subtask.completed)
    : Boolean(task.completed);
  const completedAt = subtasks.length > 0
    ? (completed ? getLatestCompletedAt(subtasks) : null)
    : (completed ? normalizeNullableString(task.completedAt) : null);

  return {
    ...task,
    completed,
    completedAt,
    isFocus: completed ? false : Boolean(task.isFocus),
    subtasks: subtasks.map((subtask) => ({
      ...subtask,
      isFocus: completed || subtask.completed ? false : Boolean(subtask.isFocus)
    }))
  };
}

function enforceSingleFocus(taskItems) {
  let focusTaken = false;

  return taskItems.map((task) => {
    if (task.completed) {
      return {
        ...task,
        isFocus: false,
        subtasks: task.subtasks.map((subtask) => ({ ...subtask, isFocus: false }))
      };
    }

    let taskHasFocusedSubtask = false;

    const subtasks = task.subtasks.map((subtask) => {
      const keepFocus = !focusTaken && !subtask.completed && Boolean(subtask.isFocus);
      if (keepFocus) {
        focusTaken = true;
        taskHasFocusedSubtask = true;
      }

      return {
        ...subtask,
        isFocus: keepFocus
      };
    });

    const keepTaskFocus = taskHasFocusedSubtask || (!focusTaken && Boolean(task.isFocus));
    if (keepTaskFocus) {
      focusTaken = true;
    }

    return {
      ...task,
      isFocus: keepTaskFocus,
      subtasks
    };
  });
}

function getTaskProgress(task) {
  const unitTotal = task.subtasks.length || 1;
  const unitCompleted = task.subtasks.length
    ? task.subtasks.filter((subtask) => subtask.completed).length
    : (task.completed ? 1 : 0);
  const totalMinutes = task.subtasks.reduce((sum, subtask) => sum + subtask.minutes, 0);
  const completedMinutes = task.subtasks
    .filter((subtask) => subtask.completed)
    .reduce((sum, subtask) => sum + subtask.minutes, 0);

  return {
    unitTotal,
    unitCompleted,
    totalMinutes,
    completedMinutes,
    percentage: unitTotal > 0 ? Math.round((unitCompleted / unitTotal) * 100) : 0
  };
}

function getFocusedSelection(taskItems) {
  for (const task of taskItems) {
    const focusedSubtask = task.subtasks.find((subtask) => subtask.isFocus);
    if (focusedSubtask) {
      return {
        taskId: task.id,
        taskTitle: task.title,
        projectId: task.projectId,
        subtaskId: focusedSubtask.id,
        subtaskTitle: focusedSubtask.title,
        minutes: focusedSubtask.minutes,
        label: focusedSubtask.title,
        description: `${task.title} - ${focusedSubtask.minutes} min`
      };
    }

    if (task.isFocus) {
      return {
        taskId: task.id,
        taskTitle: task.title,
        projectId: task.projectId,
        subtaskId: null,
        subtaskTitle: null,
        minutes: null,
        label: task.title,
        description: task.subtasks.length > 0
          ? `${task.subtasks.filter((subtask) => subtask.completed).length} de ${task.subtasks.length} subtarefas concluidas`
          : "Tarefa principal em foco"
      };
    }
  }

  return null;
}

function createId(prefix) {
  const stamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${stamp}-${random}`;
}

function cloneTask(task) {
  return {
    ...task,
    subtasks: task.subtasks.map((subtask) => ({ ...subtask }))
  };
}

function normalizeProjectId(projectId) {
  return typeof projectId === "string" && projectId.trim() ? projectId.trim() : null;
}

function normalizeProjectColor(color, title = "") {
  if (typeof color === "string" && /^#([0-9a-fA-F]{6})$/.test(color.trim())) {
    return color.trim().toUpperCase();
  }

  return getFallbackProjectColor(title);
}

function getFallbackProjectColor(seedValue) {
  const normalizedSeed = typeof seedValue === "string" ? seedValue.trim() : "";
  if (!normalizedSeed) {
    return DEFAULT_PROJECT_COLOR;
  }

  const hash = normalizedSeed
    .split("")
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);

  return PROJECT_COLOR_PALETTE[hash % PROJECT_COLOR_PALETTE.length];
}

function normalizeNullableString(value) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function normalizeCognitiveProfile(profile) {
  return {
    startEase: sanitizeCognitiveIndicator(profile?.startEase),
    anxietyLevel: sanitizeCognitiveIndicator(profile?.anxietyLevel),
    perceivedLoad: sanitizeCognitiveIndicator(profile?.perceivedLoad)
  };
}

function sanitizeCognitiveIndicator(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return null;
  }

  return Math.min(5, Math.max(1, Math.round(numericValue)));
}

function getLatestCompletedAt(subtasks) {
  const timestamps = subtasks
    .map((subtask) => subtask.completedAt)
    .filter((value) => typeof value === "string" && value.trim())
    .map((value) => new Date(value).getTime())
    .filter((value) => Number.isFinite(value));

  if (timestamps.length === 0) {
    return null;
  }

  return new Date(Math.max(...timestamps)).toISOString();
}
