export function createAppEvents({
  dom,
  onTimerStart,
  onTimerPause,
  onTimerReset,
  onTimerNextPhase,
  onApplyFocusMinutes,
  onTaskSubmit,
  onSettingsSubmit,
  onBackupExport,
  onBackupImportFile,
  onClearAll,
  onProjectSubmit,
  onTaskAction,
  onTaskToggle,
  onSubtaskToggle,
  onSubtaskSubmit,
  onProjectsAction,
  onProjectsTaskToggle,
  onProjectsSubtaskToggle,
  onDayPlanStandaloneSubmit,
  onDayPlanSourceSubmit,
  onDayPlanProjectFilterChange,
  onDayPlanAction,
  onDayPlanToggle,
  onDayPlanPriorityChange,
  onTaskRhythmViewChange,
  onTaskRhythmSubmit,
  onExecutionSubmit
}) {
  return {
    bindEvents
  };

  function bindEvents() {
    bindTimerEvents();
    bindSettingsEvents();
    bindProjectEvents();
    bindTaskEvents();
    bindDayPlanEvents();
    bindExecutionEvents();
  }

  function bindTimerEvents() {
    dom.startButton?.addEventListener("click", () => {
      onTimerStart?.();
    });

    dom.pauseButton?.addEventListener("click", () => {
      onTimerPause?.();
    });

    dom.resetButton?.addEventListener("click", () => {
      onTimerReset?.();
    });

    dom.nextPhaseButton?.addEventListener("click", () => {
      onTimerNextPhase?.();
    });

    dom.applyFocusMinutesButton?.addEventListener("click", () => {
      onApplyFocusMinutes?.();
    });
  }

  function bindSettingsEvents() {
    dom.settingsForm?.addEventListener("submit", (event) => {
      event.preventDefault();
      onSettingsSubmit?.({
        formData: new FormData(dom.settingsForm),
        event
      });
    });

    dom.backupExportButton?.addEventListener("click", (event) => {
      onBackupExport?.({
        event,
        button: dom.backupExportButton
      });
    });

    dom.backupImportButton?.addEventListener("click", () => {
      if (dom.backupImportInput) {
        dom.backupImportInput.value = "";
        dom.backupImportInput.click();
      }
    });

    dom.backupImportInput?.addEventListener("change", (event) => {
      onBackupImportFile?.({
        event,
        input: dom.backupImportInput,
        file: dom.backupImportInput?.files?.[0] ?? null
      });
    });

    dom.clearAllButton?.addEventListener("click", (event) => {
      onClearAll?.({
        event,
        button: dom.clearAllButton
      });
    });
  }

  function bindTaskEvents() {
    dom.taskForm?.addEventListener("submit", (event) => {
      event.preventDefault();
      onTaskSubmit?.({
        title: dom.taskInput?.value ?? "",
        projectId: dom.taskProjectSelect?.value ?? "",
        form: dom.taskForm,
        titleInput: dom.taskInput,
        projectSelect: dom.taskProjectSelect,
        feedbackScope: "tasks",
        event
      });
    });

    dom.taskList?.addEventListener("click", handleTaskListClick);
    dom.taskList?.addEventListener("change", handleTaskListChange);
    dom.taskList?.addEventListener("submit", handleTaskListSubmit, true);
  }

  function bindProjectEvents() {
    dom.projectForm?.addEventListener("submit", (event) => {
      event.preventDefault();
      onProjectSubmit?.({
        title: dom.projectInput?.value ?? "",
        color: dom.projectColorInput?.value ?? "",
        event
      });
    });

    dom.projectsTree?.addEventListener("click", handleProjectsTreeClick);
    dom.projectsTree?.addEventListener("change", handleProjectsTreeChange);
  }

  function bindDayPlanEvents() {
    dom.dayPlanStandaloneForm?.addEventListener("submit", (event) => {
      event.preventDefault();
      onDayPlanStandaloneSubmit?.({
        title: dom.dayPlanStandaloneInput?.value ?? "",
        priority: dom.dayPlanStandalonePriority?.value ?? "M",
        event
      });
    });

    dom.dayPlanSourceForm?.addEventListener("submit", (event) => {
      event.preventDefault();
      onDayPlanSourceSubmit?.({
        sourceValue: dom.dayPlanSourceSelect?.value ?? "",
        priority: dom.dayPlanSourcePriority?.value ?? "M",
        event
      });
    });

    dom.dayPlanProjectFilter?.addEventListener("change", (event) => {
      onDayPlanProjectFilterChange?.({
        projectId: dom.dayPlanProjectFilter?.value ?? "",
        event
      });
    });

    dom.dayPlanList?.addEventListener("click", handleDayPlanListClick);
    dom.dayPlanList?.addEventListener("change", handleDayPlanListChange);
    dom.dayPlanManageList?.addEventListener("click", handleDayPlanListClick);
    dom.dayPlanManageList?.addEventListener("change", handleDayPlanListChange);
  }

  function bindExecutionEvents() {
    dom.taskRhythmContent?.addEventListener("click", handleTaskRhythmClick);
    dom.taskRhythmContent?.addEventListener("submit", handleExecutionSubmit, true);
  }

  function handleTaskRhythmClick(event) {
    const viewButton = event.target.closest("[data-task-rhythm-view-button]");
    if (!viewButton) {
      return;
    }

    onTaskRhythmViewChange?.({
      view: viewButton.dataset.taskRhythmViewButton,
      event,
      viewButton
    });
  }

  function handleTaskListClick(event) {
    const actionButton = event.target.closest("[data-action]");
    if (!actionButton) {
      return;
    }

    onTaskAction?.({
      action: actionButton.dataset.action,
      taskId: actionButton.dataset.taskId || actionButton.closest("[data-task-id]")?.dataset.taskId,
      subtaskId:
        actionButton.dataset.subtaskId ||
        actionButton.closest("[data-subtask-id]")?.dataset.subtaskId,
      actionButton,
      event
    });
  }

  function handleTaskListChange(event) {
    const target = event.target;

    if (target.matches(".task-toggle")) {
      onTaskToggle?.({
        taskId: target.dataset.taskId,
        event,
        target
      });
      return;
    }

    if (target.matches(".subtask-toggle")) {
      onSubtaskToggle?.({
        taskId: target.dataset.taskId,
        subtaskId: target.dataset.subtaskId,
        event,
        target
      });
    }
  }

  function handleTaskListSubmit(event) {
    const form = event.target;
    if (!(form instanceof HTMLFormElement) || form.dataset.action !== "add-subtask") {
      return;
    }

    event.preventDefault();

    const formData = new FormData(form);
    onSubtaskSubmit?.({
      form,
      taskId: form.dataset.taskId,
      title: String(formData.get("subtaskTitle") ?? ""),
      minutes: formData.get("subtaskMinutes"),
      feedbackElement: form.querySelector("[data-feedback-for-task]"),
      event
    });
  }

  function handleProjectsTreeClick(event) {
    const actionTarget = event.target.closest("[data-project-action]");
    if (!actionTarget) {
      return;
    }

    onProjectsAction?.({
      action: actionTarget.dataset.projectAction,
      projectId: actionTarget.dataset.projectId || actionTarget.closest("[data-project-id]")?.dataset.projectId,
      taskId: actionTarget.dataset.taskId || actionTarget.closest("[data-task-id]")?.dataset.taskId,
      subtaskId:
        actionTarget.dataset.subtaskId ||
        actionTarget.closest("[data-subtask-id]")?.dataset.subtaskId,
      event,
      actionTarget
    });
  }

  function handleProjectsTreeChange(event) {
    const target = event.target;

    if (target.matches(".projects-task-toggle")) {
      onProjectsTaskToggle?.({
        taskId: target.dataset.taskId,
        event,
        target
      });
      return;
    }

    if (target.matches(".projects-subtask-toggle")) {
      onProjectsSubtaskToggle?.({
        taskId: target.dataset.taskId,
        subtaskId: target.dataset.subtaskId,
        event,
        target
      });
    }
  }
  function handleDayPlanListClick(event) {
    const actionTarget = event.target.closest("[data-day-plan-action]");
    if (!actionTarget) {
      return;
    }

    onDayPlanAction?.({
      action: actionTarget.dataset.dayPlanAction,
      itemId: actionTarget.dataset.dayPlanId,
      event,
      actionTarget
    });
  }

  function handleDayPlanListChange(event) {
    const target = event.target;

    if (target.matches(".day-plan-toggle")) {
      onDayPlanToggle?.({
        itemId: target.dataset.dayPlanId,
        event,
        target
      });
      return;
    }

    if (target.matches(".day-plan-priority-select")) {
      onDayPlanPriorityChange?.({
        itemId: target.dataset.dayPlanId,
        priority: target.value,
        event,
        target
      });
    }
  }

  function handleExecutionSubmit(event) {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) {
      return;
    }

    if (form.id === "task-rhythm-form") {
      event.preventDefault();
      onTaskRhythmSubmit?.({
        formData: new FormData(form),
        form,
        event
      });
      return;
    }

    if (!["execution-form", "execution-notes-form"].includes(form.id)) {
      return;
    }

    event.preventDefault();

    const modeForm = document.querySelector("#execution-form");
    const notesForm = document.querySelector("#execution-notes-form");
    if (!(modeForm instanceof HTMLFormElement) || !(notesForm instanceof HTMLFormElement)) {
      return;
    }

    const modeData = new FormData(modeForm);
    const notesData = new FormData(notesForm);

    onExecutionSubmit?.({
      mode: String(modeData.get("mode") ?? "solo"),
      materials: String(modeData.get("materials") ?? ""),
      actions: modeData.getAll("actions").map((value) => String(value)),
      contacts: String(notesData.get("contacts") ?? ""),
      phones: String(notesData.get("phones") ?? ""),
      notes: String(notesData.get("notes") ?? ""),
      instructions: String(notesData.get("instructions") ?? ""),
      event,
      form
    });
  }
}
