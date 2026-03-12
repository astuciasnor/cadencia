import {
  PROVISIONAL_PROJECT_ID,
  buildTaskView,
  ensureTasksGroupedIntoProject,
  createProject,
  createSubtask,
  createTask,
  normalizeCognitiveProfile,
  normalizeProjectCollection,
  normalizeProjectTitle,
  normalizeTaskNote,
  normalizeTaskCollection,
  normalizeTaskTitle,
  sanitizeMinutes,
  summarizeTaskCollection
} from "./task-model.js";

export function createTaskStore(storageApi) {
  const taskStorageKey = "cadencia.tasks";
  const projectStorageKey = "cadencia.projects";
  const structuredData = loadStructuredDataFromStorage();
  let projectItems = structuredData.projects;
  let taskItems = structuredData.tasks;

  return {
    getProjects,
    getTasks,
    getSummary,
    reload,
    addProject,
    duplicateProject,
    updateProject,
    removeProject,
    addTask,
    updateTask,
    removeTask,
    toggleTask,
    addSubtask,
    updateSubtask,
    removeSubtask,
    toggleSubtask,
    setFocus,
    clearFocus
  };

  function getProjects() {
    return projectItems.map((project) => ({ ...project }));
  }

  function getTasks() {
    return taskItems.map((task) => buildTaskView(task));
  }

  function getSummary() {
    return summarizeTaskCollection(taskItems);
  }

  function reload() {
    const nextStructuredData = loadStructuredDataFromStorage();
    projectItems = nextStructuredData.projects;
    taskItems = nextStructuredData.tasks;

    return {
      projects: getProjects(),
      tasks: getTasks()
    };
  }

  function addProject(title, color = null) {
    const normalizedTitle = normalizeProjectTitle(title);
    if (!normalizedTitle) {
      return getProjects();
    }

    return commitProjectItems([
      createProject(normalizedTitle, color),
      ...projectItems
    ]);
  }

  function duplicateProject(projectId, nextTitle) {
    const sourceProject = projectItems.find((project) => project.id === projectId);
    if (!sourceProject) {
      return null;
    }

    const normalizedTitle = normalizeProjectTitle(nextTitle);
    if (!normalizedTitle) {
      return null;
    }

    const duplicatedProject = createProject(normalizedTitle, sourceProject.color);
    const sourceTasks = taskItems.filter((task) => task.projectId === projectId);
    const duplicatedTasks = sourceTasks.map((task) => ({
      ...createTask(task.title, duplicatedProject.id),
      nextStepNote: normalizeTaskNote(task.nextStepNote),
      cognitiveProfile: normalizeCognitiveProfile(task.cognitiveProfile),
      subtasks: task.subtasks.map((subtask) => ({
        ...createSubtask(subtask.title, sanitizeMinutes(subtask.minutes, 15)),
        nextStepNote: normalizeTaskNote(subtask.nextStepNote),
        cognitiveProfile: normalizeCognitiveProfile(subtask.cognitiveProfile)
      }))
    }));

    commitProjectItems([
      duplicatedProject,
      ...projectItems
    ]);
    commitTaskItems([
      ...duplicatedTasks,
      ...taskItems
    ]);

    return {
      project: { ...duplicatedProject },
      taskCount: duplicatedTasks.length
    };
  }

  function updateProject(projectId, patch) {
    let hasChanges = false;
    const nextProjectItems = projectItems.map((project) => {
      if (project.id !== projectId) {
        return project;
      }

      const nextTitle = normalizeProjectTitle(patch?.title) || project.title;
      const nextColor = typeof patch?.color === "string" && patch.color.trim()
        ? patch.color.trim().toUpperCase()
        : project.color;
      if (nextTitle === project.title && nextColor === project.color) {
        return project;
      }

      hasChanges = true;
      return {
        ...project,
        title: nextTitle,
        color: nextColor,
        updatedAt: new Date().toISOString()
      };
    });

    return commitProjectItems(nextProjectItems, hasChanges);
  }

  function removeProject(projectId) {
    const nextProjectItems = projectItems.filter((project) => project.id !== projectId);
    const hasProjectChanges = nextProjectItems.length !== projectItems.length;
    if (!hasProjectChanges) {
      return getProjects();
    }

    const nextTaskItems = taskItems.map((task) => (
      task.projectId === projectId
        ? { ...task, projectId: null }
        : task
    ));

    taskItems = reconcileTaskProjectIds(nextTaskItems);
    projectItems = normalizeProjectCollection(nextProjectItems, []);
    persistCollections();
    return getProjects();
  }

  function addTask(title, projectId = null) {
    const normalizedTitle = normalizeTaskTitle(title);
    if (!normalizedTitle) {
      return getTasks();
    }

    return commitTaskItems([
      createTask(normalizedTitle, resolveProjectId(projectId)),
      ...taskItems
    ]);
  }

  function updateTask(taskId, patch) {
    let hasChanges = false;
    const nextTaskItems = taskItems.map((task) => {
      if (task.id !== taskId) {
        return task;
      }

      const nextTitle = normalizeTaskTitle(patch?.title) || task.title;
      const nextProjectId = patch && Object.prototype.hasOwnProperty.call(patch, "projectId")
        ? resolveProjectId(patch.projectId)
        : task.projectId;
      const nextStepNote = patch && Object.prototype.hasOwnProperty.call(patch, "nextStepNote")
        ? normalizeTaskNote(patch.nextStepNote)
        : task.nextStepNote;
      const nextCognitiveProfile = patch && Object.prototype.hasOwnProperty.call(patch, "cognitiveProfile")
        ? normalizeCognitiveProfile(patch.cognitiveProfile)
        : task.cognitiveProfile;
      const hasCognitiveChange = JSON.stringify(nextCognitiveProfile) !== JSON.stringify(task.cognitiveProfile);
      if (
        nextTitle === task.title &&
        nextProjectId === task.projectId &&
        nextStepNote === task.nextStepNote &&
        !hasCognitiveChange
      ) {
        return task;
      }

      hasChanges = true;
      return {
        ...task,
        title: nextTitle,
        projectId: nextProjectId,
        nextStepNote: nextStepNote,
        cognitiveProfile: nextCognitiveProfile
      };
    });

    return commitTaskItems(nextTaskItems, hasChanges);
  }

  function removeTask(taskId) {
    const nextTaskItems = taskItems.filter((task) => task.id !== taskId);
    return commitTaskItems(nextTaskItems, nextTaskItems.length !== taskItems.length);
  }

  function toggleTask(taskId) {
    let hasChanges = false;
    const completedAt = new Date().toISOString();
    const nextTaskItems = taskItems.map((task) => {
      if (task.id !== taskId) {
        return task;
      }

      hasChanges = true;
      const isCompleted = !task.completed;
      return {
        ...task,
        completed: isCompleted,
        completedAt: isCompleted ? completedAt : null,
        isFocus: isCompleted ? false : task.isFocus,
        subtasks: task.subtasks.map((subtask) => ({
          ...subtask,
          completed: isCompleted,
          completedAt: isCompleted ? completedAt : null,
          isFocus: isCompleted ? false : subtask.isFocus
        }))
      };
    });

    return commitTaskItems(nextTaskItems, hasChanges);
  }

  function addSubtask(taskId, title, minutes) {
    const normalizedTitle = normalizeTaskTitle(title);
    if (!normalizedTitle) {
      return getTasks();
    }

    let hasChanges = false;
    const nextTaskItems = taskItems.map((task) => {
      if (task.id !== taskId) {
        return task;
      }

      hasChanges = true;
      return {
        ...task,
        subtasks: [
          ...task.subtasks,
          createSubtask(normalizedTitle, minutes)
        ]
      };
    });

    return commitTaskItems(nextTaskItems, hasChanges);
  }

  function updateSubtask(taskId, subtaskId, patch) {
    let hasChanges = false;
    const nextTaskItems = taskItems.map((task) => {
      if (task.id !== taskId) {
        return task;
      }

      return {
        ...task,
        subtasks: task.subtasks.map((subtask) => {
          if (subtask.id !== subtaskId) {
            return subtask;
          }

          const nextTitle = normalizeTaskTitle(patch?.title) || subtask.title;
          const nextMinutes = sanitizeMinutes(patch?.minutes, subtask.minutes);
          const nextStepNote = patch && Object.prototype.hasOwnProperty.call(patch, "nextStepNote")
            ? normalizeTaskNote(patch.nextStepNote)
            : subtask.nextStepNote;
          const nextCognitiveProfile = patch && Object.prototype.hasOwnProperty.call(patch, "cognitiveProfile")
            ? normalizeCognitiveProfile(patch.cognitiveProfile)
            : subtask.cognitiveProfile;
          const hasCognitiveChange = JSON.stringify(nextCognitiveProfile) !== JSON.stringify(subtask.cognitiveProfile);
          if (
            nextTitle === subtask.title &&
            nextMinutes === subtask.minutes &&
            nextStepNote === subtask.nextStepNote &&
            !hasCognitiveChange
          ) {
            return subtask;
          }

          hasChanges = true;
          return {
            ...subtask,
            title: nextTitle,
            minutes: nextMinutes,
            nextStepNote: nextStepNote,
            cognitiveProfile: nextCognitiveProfile
          };
        })
      };
    });

    return commitTaskItems(nextTaskItems, hasChanges);
  }

  function removeSubtask(taskId, subtaskId) {
    let hasChanges = false;
    const nextTaskItems = taskItems.map((task) => {
      if (task.id !== taskId) {
        return task;
      }

      const nextSubtasks = task.subtasks.filter((subtask) => subtask.id !== subtaskId);
      if (nextSubtasks.length === task.subtasks.length) {
        return task;
      }

      hasChanges = true;
      return {
        ...task,
        subtasks: nextSubtasks
      };
    });

    return commitTaskItems(nextTaskItems, hasChanges);
  }

  function toggleSubtask(taskId, subtaskId) {
    let hasChanges = false;
    const completedAt = new Date().toISOString();
    const nextTaskItems = taskItems.map((task) => {
      if (task.id !== taskId) {
        return task;
      }

      return {
        ...task,
        subtasks: task.subtasks.map((subtask) => {
          if (subtask.id !== subtaskId) {
            return subtask;
          }

          hasChanges = true;
          const isCompleted = !subtask.completed;
          return {
            ...subtask,
            completed: isCompleted,
            completedAt: isCompleted ? completedAt : null,
            isFocus: isCompleted ? false : subtask.isFocus
          };
        })
      };
    });

    return commitTaskItems(nextTaskItems, hasChanges);
  }

  function setFocus(taskId, subtaskId = null) {
    if (isSameFocusSelection(taskId, subtaskId)) {
      return getTasks();
    }

    return commitTaskItems(
      taskItems.map((task) => ({
        ...task,
        isFocus: task.id === taskId,
        subtasks: task.subtasks.map((subtask) => ({
          ...subtask,
          isFocus: task.id === taskId && subtask.id === subtaskId
        }))
      }))
    );
  }

  function clearFocus() {
    if (!hasFocusSelection()) {
      return getTasks();
    }

    return commitTaskItems(
      taskItems.map((task) => ({
        ...task,
        isFocus: false,
        subtasks: task.subtasks.map((subtask) => ({
          ...subtask,
          isFocus: false
        }))
      }))
    );
  }

  function commitTaskItems(nextTaskItems, hasChanges = true) {
    if (!hasChanges) {
      return getTasks();
    }

    const structuredData = ensureTasksGroupedIntoProject(
      normalizeTaskCollection(nextTaskItems, []),
      projectItems
    );
    projectItems = structuredData.projects;
    taskItems = structuredData.tasks;
    persistCollections();
    return getTasks();
  }

  function commitProjectItems(nextProjectItems, hasChanges = true) {
    if (!hasChanges) {
      return getProjects();
    }

    const structuredData = ensureTasksGroupedIntoProject(
      taskItems,
      normalizeProjectCollection(nextProjectItems, [])
    );
    projectItems = structuredData.projects;
    taskItems = structuredData.tasks;
    persistCollections();
    return getProjects();
  }

  function persistCollections() {
    if (typeof storageApi.updateState === "function") {
      storageApi.updateState((state) => ({
        ...state,
        projects: projectItems,
        tasks: taskItems
      }));
      return;
    }

    persistProjectItems();
    persistTaskItems();
  }

  function persistTaskItems() {
    storageApi.set(taskStorageKey, taskItems);
  }

  function persistProjectItems() {
    storageApi.set(projectStorageKey, projectItems);
  }

  function hasFocusSelection() {
    return taskItems.some(
      (task) => task.isFocus || task.subtasks.some((subtask) => subtask.isFocus)
    );
  }

  function isSameFocusSelection(taskId, subtaskId) {
    return taskItems.some((task) => {
      if (task.id !== taskId) {
        return false;
      }

      if (subtaskId === null) {
        return task.isFocus && !task.subtasks.some((subtask) => subtask.isFocus);
      }

      return task.subtasks.some((subtask) => subtask.id === subtaskId && subtask.isFocus);
    });
  }

  function resolveProjectId(projectId) {
    if (typeof projectId !== "string" || !projectId.trim()) {
      return PROVISIONAL_PROJECT_ID;
    }

    return projectItems.some((project) => project.id === projectId)
      ? projectId
      : PROVISIONAL_PROJECT_ID;
  }

  function reconcileTaskProjectIds(tasks) {
    return ensureTasksGroupedIntoProject(tasks, projectItems).tasks;
  }

  function loadStructuredDataFromStorage() {
    return ensureTasksGroupedIntoProject(
      normalizeTaskCollection(storageApi.get(taskStorageKey, []), []),
      normalizeProjectCollection(storageApi.get(projectStorageKey, []), [])
    );
  }
}
