export function createUiFeedback({
  taskFeedbackElement,
  settingsFeedbackElement,
  backupFeedbackElement,
  projectFeedbackElement,
  dayPlanFeedbackElement,
  executionFeedbackElement
} = {}) {
  const feedbackTimers = {
    task: null,
    settings: null,
    backup: null,
    project: null,
    dayPlan: null,
    execution: null,
    subtaskByTask: new Map()
  };

  return {
    showTaskFeedback,
    showSettingsFeedback,
    showBackupFeedback,
    showProjectFeedback,
    showDayPlanFeedback,
    showExecutionFeedback,
    showSubtaskFeedback,
    focusSubtaskTitleInput,
    highlightNewTask,
    highlightNewSubtask
  };

  function showTaskFeedback(message, tone = "") {
    setFeedbackMessage(taskFeedbackElement, feedbackTimers, "task", message, tone);
  }

  function showSettingsFeedback(message, tone = "") {
    setFeedbackMessage(settingsFeedbackElement, feedbackTimers, "settings", message, tone, {
      autoHideMs: tone === "success" ? 2200 : 0
    });
  }

  function showBackupFeedback(message, tone = "") {
    setFeedbackMessage(backupFeedbackElement, feedbackTimers, "backup", message, tone, {
      autoHideMs: tone === "success" ? 2600 : 0
    });
  }

  function showProjectFeedback(message, tone = "") {
    setFeedbackMessage(projectFeedbackElement, feedbackTimers, "project", message, tone);
  }

  function showDayPlanFeedback(message, tone = "") {
    setFeedbackMessage(dayPlanFeedbackElement, feedbackTimers, "dayPlan", message, tone);
  }

  function showExecutionFeedback(message, tone = "") {
    setFeedbackMessage(executionFeedbackElement, feedbackTimers, "execution", message, tone);
  }

  function showSubtaskFeedback(taskId, message, tone = "", feedbackElementOverride = null) {
    const feedbackElement = feedbackElementOverride || findSubtaskFeedbackElement(taskId);
    if (!feedbackElement) {
      showTaskFeedback(message, tone || "success");
      return;
    }

    setFeedbackMessage(
      feedbackElement,
      feedbackTimers.subtaskByTask,
      taskId,
      message,
      tone,
      { autoHideMs: tone === "error" ? 3000 : 2200 }
    );
  }

  function focusSubtaskTitleInput(taskId) {
    if (!taskId) {
      return;
    }

    const selectorTaskId = escapeSelectorValue(taskId);
    const titleInput = document.querySelector(
      `[data-action="add-subtask"][data-task-id="${selectorTaskId}"] input[name="subtaskTitle"]`
    );

    titleInput?.focus();
  }

  function highlightNewTask(taskId) {
    if (!taskId) {
      return;
    }

    highlightElement(
      document.querySelector(`[data-task-id="${escapeSelectorValue(taskId)}"]`)
    );
  }

  function highlightNewSubtask(taskId, subtaskId) {
    if (!taskId || !subtaskId) {
      return;
    }

    highlightElement(
      document.querySelector(
        `[data-task-id="${escapeSelectorValue(taskId)}"] [data-subtask-id="${escapeSelectorValue(subtaskId)}"]`
      )
    );
  }
}

function setFeedbackMessage(element, timerStore, key, message, tone = "", options = {}) {
  if (!element) {
    return;
  }

  clearFeedbackTimer(timerStore, key);
  element.textContent = message;
  element.dataset.visible = message ? "true" : "false";
  updateTone(element, tone);

  const autoHideMs = options.autoHideMs ?? (tone === "error" ? 0 : 2200);
  if (!message || autoHideMs <= 0) {
    return;
  }

  const timeoutId = window.setTimeout(() => {
    element.textContent = "";
    element.dataset.visible = "false";
    updateTone(element, "");
    clearFeedbackTimer(timerStore, key);
  }, autoHideMs);

  setFeedbackTimer(timerStore, key, timeoutId);
}

function setFeedbackTimer(timerStore, key, timeoutId) {
  if (timerStore instanceof Map) {
    timerStore.set(key, timeoutId);
    return;
  }

  timerStore[key] = timeoutId;
}

function clearFeedbackTimer(timerStore, key) {
  if (timerStore instanceof Map) {
    const timeoutId = timerStore.get(key);
    if (timeoutId) {
      window.clearTimeout(timeoutId);
      timerStore.delete(key);
    }
    return;
  }

  const timeoutId = timerStore[key];
  if (timeoutId) {
    window.clearTimeout(timeoutId);
    timerStore[key] = null;
  }
}

function updateTone(element, tone) {
  if (!element) {
    return;
  }

  if (tone) {
    element.dataset.tone = tone;
  } else {
    delete element.dataset.tone;
  }
}

function findSubtaskFeedbackElement(taskId) {
  if (!taskId) {
    return null;
  }

  return document.querySelector(
    `[data-feedback-for-task="${escapeSelectorValue(taskId)}"]`
  );
}

function highlightElement(element) {
  if (!element) {
    return;
  }

  element.classList.remove("is-fresh");
  void element.offsetWidth;
  element.classList.add("is-fresh");

  window.setTimeout(() => {
    element.classList.remove("is-fresh");
  }, 1800);
}

function escapeSelectorValue(value) {
  const normalizedValue = String(value);
  if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
    return CSS.escape(normalizedValue);
  }

  return normalizedValue.replace(/["\\]/g, "\\$&");
}
