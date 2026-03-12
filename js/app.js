import { storage } from "./storage.js";
import { DEFAULT_PROJECT_COLOR, PROVISIONAL_PROJECT_ID } from "./task-model.js";
import { createTaskStore } from "./tasks.js";
import { createPhaseEndSound } from "./phase-sound.js";
import { createTimer } from "./timer.js";
import {
  buildDayProgressView,
  buildTaskRhythmView,
  findProjectById,
  findTaskById,
  findTaskSelection,
  inferProjectMetadata,
  getApplyFocusMinutesSuccessMessage,
  getContextTip,
  getFocusedItemMinutes,
  getFocusTimeHelperText,
  getPhaseHint,
  getReservedFocusMinutes,
  getTimerStatusText,
  getTodayHistoryFromSnapshot
} from "./app-helpers.js";
import { createAppEvents } from "./app-events.js";
import { createUiFeedback } from "./ui-feedback.js";
import { getFocusKey, getStandaloneDayPlanFocus, resolveCurrentFocus } from "./focus-model.js";
import { renderDayProgressSection } from "./render-day-progress.js";
import { renderDayPlanSection } from "./render-day-plan.js";
import { renderProjectsSection } from "./render-projects.js";
import { renderSummarySection } from "./render-summary.js";
import { renderTaskRhythmSection } from "./render-task-rhythm.js";
import { renderTaskFocusTimeHelper, renderTaskSection } from "./render-tasks.js";
import { setupPwaSupport } from "./pwa.js";
import { formatDuration } from "./utils.js";

const DAY_PLAN_STORAGE_KEY = "cadencia.day-plan";

const dom = {
  body: document.body,
  tabButtons: Array.from(document.querySelectorAll("[data-tab-button]")),
  tabPanels: Array.from(document.querySelectorAll("[data-tab-panel]")),
  currentDate: document.querySelector("#current-date"),
  currentMode: document.querySelector("#current-mode"),
  timerStatus: document.querySelector("#timer-status"),
  timerDisplay: document.querySelector("#timer-display"),
  phaseHint: document.querySelector("#phase-hint"),
  contextTip: document.querySelector("#context-tip"),
  startButton: document.querySelector("#start-button"),
  pauseButton: document.querySelector("#pause-button"),
  resetButton: document.querySelector("#reset-button"),
  nextPhaseButton: document.querySelector("#next-phase-button"),
  focusTimeHelper: document.querySelector("#focus-time-helper"),
  focusTimeHelperText: document.querySelector("#focus-time-helper-text"),
  applyFocusMinutesButton: document.querySelector("#apply-focus-minutes-button"),
  pwaInstallPanel: document.querySelector("#pwa-install-panel"),
  pwaInstallButton: document.querySelector("#pwa-install-button"),
  pwaInstallFeedback: document.querySelector("#pwa-install-feedback"),
  pwaInstallHelp: document.querySelector("#pwa-install-help"),
  pwaInstallInstructions: document.querySelector("#pwa-install-instructions"),
  pwaAvailabilityBadge: document.querySelector("#pwa-availability-badge"),
  pwaInstalledBadge: document.querySelector("#pwa-installed-badge"),
  pwaUpdateToast: document.querySelector("#pwa-update-toast"),
  pwaUpdateMessage: document.querySelector("#pwa-update-message"),
  pwaUpdateButton: document.querySelector("#pwa-update-button"),
  dayPlanSummary: document.querySelector("#day-plan-summary"),
  dayPlanStandaloneForm: document.querySelector("#day-plan-standalone-form"),
  dayPlanStandaloneInput: document.querySelector("#day-plan-standalone-input"),
  dayPlanStandalonePriority: document.querySelector("#day-plan-standalone-priority"),
  dayPlanSourceForm: document.querySelector("#day-plan-source-form"),
  dayPlanProjectFilter: document.querySelector("#day-plan-project-filter"),
  dayPlanSourceSelect: document.querySelector("#day-plan-source-select"),
  dayPlanSourcePriority: document.querySelector("#day-plan-source-priority"),
  dayPlanViewButtons: Array.from(document.querySelectorAll("[data-day-plan-view-button]")),
  dayPlanViewPanels: Array.from(document.querySelectorAll("[data-day-plan-view-panel]")),
  dayPlanFeedback: document.querySelector("#day-plan-feedback"),
  dayPlanManageList: document.querySelector("#day-plan-manage-list"),
  dayPlanList: document.querySelector("#day-plan-list"),
  dayProgressContent: document.querySelector("#day-progress-content"),
  executionFeedback: document.querySelector("#execution-feedback"),
  projectForm: document.querySelector("#project-form"),
  projectInput: document.querySelector("#project-input"),
  projectColorInput: document.querySelector("#project-color-input"),
  projectFeedback: document.querySelector("#projects-feedback"),
  projectsTreeSelect: document.querySelector("#projects-tree-select"),
  projectsTree: document.querySelector("#projects-tree"),
  projectsSummary: document.querySelector("#projects-summary"),
  taskRhythmContent: document.querySelector("#task-rhythm-content"),
  taskForm: document.querySelector("#task-form"),
  taskInput: document.querySelector("#task-input"),
  taskProjectSelect: document.querySelector("#task-project-select"),
  taskFeedback: document.querySelector("#task-feedback"),
  taskList: document.querySelector("#task-list"),
  taskSummary: document.querySelector("#task-summary"),
  taskFocusLabel: document.querySelector("#task-focus-label"),
  taskFocusCaption: document.querySelector("#task-focus-caption"),
  settingsForm: document.querySelector("#settings-form"),
  settingsFeedback: document.querySelector("#settings-feedback"),
  backupExportButton: document.querySelector("#backup-export-button"),
  backupImportButton: document.querySelector("#backup-import-button"),
  backupImportInput: document.querySelector("#backup-import-input"),
  clearAllButton: document.querySelector("#clear-all-button"),
  backupFeedback: document.querySelector("#backup-feedback"),
  summarySessionsToday: document.querySelector("#summary-sessions-today"),
  summaryMinutesToday: document.querySelector("#summary-minutes-today"),
  summaryCurrentTask: document.querySelector("#summary-current-task"),
  summaryCurrentSubtask: document.querySelector("#summary-current-subtask")
};

const appState = {
  activeTab: "timer",
  activeDayPlanView: "compose",
  activeTaskRhythmView: "rhythm",
  collapsedProjectTaskIds: new Set(),
  snapshot: null,
  projects: [],
  selectedDayPlanProjectFilterId: "",
  selectedProjectTreeId: "",
  dayPlan: {
    items: [],
    activeItemId: null
  },
  execution: {
    entries: {}
  },
  tasks: [],
  taskSummary: null,
  todayHistory: null,
  lastPersistedSessionKey: ""
};

const taskStore = createTaskStore(storage);
const uiFeedback = createUiFeedback({
  taskFeedbackElement: dom.taskFeedback,
  settingsFeedbackElement: dom.settingsFeedback,
  backupFeedbackElement: dom.backupFeedback,
  projectFeedbackElement: dom.projectFeedback,
  dayPlanFeedbackElement: dom.dayPlanFeedback,
  executionFeedbackElement: dom.executionFeedback
});

const {
  showTaskFeedback,
  showSettingsFeedback,
  showBackupFeedback,
  showProjectFeedback,
  showSubtaskFeedback,
  showDayPlanFeedback,
  showExecutionFeedback,
  highlightNewTask,
  highlightNewSubtask
} = uiFeedback;

let timer = createFallbackTimer();
let isReloadingForServiceWorkerUpdate = false;
const phaseEndSound = createPhaseEndSound();
const pwaSupport = setupPwaSupport({
  installPanel: dom.pwaInstallPanel,
  installButton: dom.pwaInstallButton,
  installFeedback: dom.pwaInstallFeedback,
  installHelp: dom.pwaInstallHelp,
  installInstructions: dom.pwaInstallInstructions,
  availabilityBadge: dom.pwaAvailabilityBadge,
  installedBadge: dom.pwaInstalledBadge,
  updateToast: dom.pwaUpdateToast,
  updateMessage: dom.pwaUpdateMessage,
  updateButton: dom.pwaUpdateButton
});
const appEvents = createAppEvents({
  dom,
  onTimerStart: () => {
    preparePhaseEndSound();
    timer.start();
  },
  onTimerPause: () => {
    timer.pause();
  },
  onTimerReset: () => {
    timer.reset();
    showSettingsFeedback("");
  },
  onTimerNextPhase: () => {
    timer.nextPhase();
  },
  onApplyFocusMinutes: handleApplyFocusMinutesRequest,
  onTaskSubmit: handleTaskSubmitRequest,
  onSettingsSubmit: handleSettingsSubmitRequest,
  onBackupExport: handleBackupExportRequest,
  onBackupImportFile: handleBackupImportFileRequest,
  onClearAll: handleClearAllRequest,
  onProjectSubmit: handleProjectSubmitRequest,
  onTaskAction: handleTaskActionRequest,
  onTaskToggle: handleTaskToggleRequest,
  onSubtaskToggle: handleSubtaskToggleRequest,
  onSubtaskSubmit: handleSubtaskSubmitRequest,
  onProjectsAction: handleProjectsActionRequest,
  onProjectsTaskToggle: handleProjectsTaskToggleRequest,
  onProjectsSubtaskToggle: handleProjectsSubtaskToggleRequest,
  onDayPlanStandaloneSubmit: handleDayPlanStandaloneSubmitRequest,
  onDayPlanSourceSubmit: handleDayPlanSourceSubmitRequest,
  onDayPlanProjectFilterChange: handleDayPlanProjectFilterChangeRequest,
  onDayPlanAction: handleDayPlanActionRequest,
  onDayPlanToggle: handleDayPlanToggleRequest,
  onDayPlanPriorityChange: handleDayPlanPriorityChangeRequest,
  onTaskRhythmViewChange: handleTaskRhythmViewChangeRequest,
  onTaskRhythmSubmit: handleTaskRhythmSubmitRequest,
  onExecutionSubmit: handleExecutionSubmitRequest
});

appEvents.bindEvents();
initializeApp();

function initializeApp() {
  try {
    bindTabEvents();
    bindDayPlanViewEvents();
    bindProjectsTreeSelectionEvent();
    setActiveTab(appState.activeTab);
    setActiveDayPlanView(appState.activeDayPlanView);
    syncStateFromStore();
    renderCurrentDate();
    hydrateSettingsForm();
    renderTaskUi();
    renderDayPlanUi();
    renderProjectsUi();
    renderTaskRhythmUi();
    renderExecutionUi();
    renderSummaryUi();
    renderDayProgressUi();
    initializeTimer();
    registerServiceWorker();

    window.addEventListener("beforeunload", () => {
      timer.destroy();
      phaseEndSound.destroy();
    });
  } catch (error) {
    console.error("Falha ao inicializar o app.", error);
    showTaskFeedback("O app iniciou com limitacoes. Tente recarregar a pagina.", "error");
  }
}

function bindTabEvents() {
  dom.tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const nextTab = button.dataset.tabButton;
      if (!nextTab) {
        return;
      }

      setActiveTab(nextTab);
    });
  });
}

function bindProjectsTreeSelectionEvent() {
  dom.projectsTreeSelect?.addEventListener("change", () => {
    appState.selectedProjectTreeId = dom.projectsTreeSelect?.value ?? "";
    renderProjectsUi();
  });
}

function bindDayPlanViewEvents() {
  dom.dayPlanViewButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const nextView = button.dataset.dayPlanViewButton;
      if (!nextView) {
        return;
      }

      setActiveDayPlanView(nextView);
    });
  });
}

function setActiveTab(nextTab) {
  const resolvedTab = resolveTabId(nextTab);
  appState.activeTab = resolvedTab;
  dom.body.dataset.activeTab = resolvedTab;

  dom.tabButtons.forEach((button) => {
    const isActive = button.dataset.tabButton === resolvedTab;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-selected", String(isActive));
    button.setAttribute("tabindex", isActive ? "0" : "-1");
  });

  dom.tabPanels.forEach((panel) => {
    const isActive = panel.dataset.tabPanel === resolvedTab;
    panel.classList.toggle("is-active", isActive);
    panel.hidden = !isActive;
    panel.setAttribute("aria-hidden", String(!isActive));
    panel.inert = !isActive;
  });
}

function setActiveDayPlanView(nextView) {
  const resolvedView = resolveDayPlanViewId(nextView);
  appState.activeDayPlanView = resolvedView;

  dom.dayPlanViewButtons.forEach((button) => {
    const isActive = button.dataset.dayPlanViewButton === resolvedView;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-selected", String(isActive));
    button.setAttribute("tabindex", isActive ? "0" : "-1");
  });

  dom.dayPlanViewPanels.forEach((panel) => {
    const isActive = panel.dataset.dayPlanViewPanel === resolvedView;
    panel.classList.toggle("is-active", isActive);
    panel.hidden = !isActive;
    panel.setAttribute("aria-hidden", String(!isActive));
  });
}

function resolveTabId(nextTab) {
  const hasMatchingButton = dom.tabButtons.some((button) => button.dataset.tabButton === nextTab);
  const hasMatchingPanel = dom.tabPanels.some((panel) => panel.dataset.tabPanel === nextTab);

  if (hasMatchingButton && hasMatchingPanel) {
    return nextTab;
  }

  return "timer";
}

function resolveDayPlanViewId(nextView) {
  const hasMatchingButton = dom.dayPlanViewButtons.some((button) => button.dataset.dayPlanViewButton === nextView);
  const hasMatchingPanel = dom.dayPlanViewPanels.some((panel) => panel.dataset.dayPlanViewPanel === nextView);

  if (hasMatchingButton && hasMatchingPanel) {
    return nextView;
  }

  return "compose";
}

function initializeTimer() {
  try {
    timer.destroy();
    timer = createTimer({
      settings: appState.snapshot.settings,
      initialSession: appState.snapshot.currentSession,
      onTick: handleTimerTick,
      onStateChange: handleTimerStateChange,
      onPhaseChange: handleTimerPhaseChange,
      onSessionChange: handleTimerSessionChange,
      onPhaseComplete: handlePhaseComplete
    });
  } catch (error) {
    console.error("Falha ao inicializar o timer.", error);
    showSettingsFeedback("O temporizador nao foi inicializado corretamente.", "error");
    timer = createFallbackTimer();
  }
}

function handleTaskSubmitRequest({
  title,
  projectId,
  form,
  titleInput,
  projectSelect,
  feedbackScope = "tasks"
}) {
  console.debug("[Cadencia] submit de tarefa recebido.", { title, projectId, feedbackScope });

  if (!title.trim()) {
    showTaskSubmitFeedback(feedbackScope, "Digite um titulo para a tarefa.", "error");
    titleInput?.focus();
    return;
  }

  const updatedTasks = applyTaskMutation(
    () => taskStore.addTask(title, projectId),
    "Tarefa adicionada.",
    { skipDefaultFeedback: true }
  );

  if (!updatedTasks) {
    return;
  }

  form?.reset();
  if (projectSelect) {
    projectSelect.value = "";
  }
  highlightNewTask(updatedTasks[0]?.id);
  showTaskSubmitFeedback(feedbackScope, "Tarefa adicionada com sucesso.", "success");
  titleInput?.focus();
}

function handleProjectSubmitRequest({ title, color }) {
  if (!title.trim()) {
    showProjectFeedback("Digite um nome para o projeto.", "error");
    dom.projectInput?.focus();
    return;
  }

  if (appState.projects.some((project) => project.title.toLowerCase() === title.trim().toLowerCase())) {
    showProjectFeedback("Ja existe um projeto com esse nome.", "error");
    dom.projectInput?.focus();
    return;
  }

  const updatedProjects = applyProjectMutation(() => taskStore.addProject(title, color), "Projeto criado com sucesso.");
  if (updatedProjects?.[0]?.id) {
    appState.selectedProjectTreeId = updatedProjects[0].id;
    renderProjectsUi();
  }
  dom.projectForm?.reset();
  if (dom.projectColorInput) {
    dom.projectColorInput.value = DEFAULT_PROJECT_COLOR;
  }
  dom.projectInput?.focus();
}

function showTaskSubmitFeedback(feedbackScope, message, tone) {
  if (feedbackScope === "projects") {
    showProjectFeedback(message, tone);
    return;
  }

  showTaskFeedback(message, tone);
}

function handleDayPlanStandaloneSubmitRequest({ title, priority }) {
  if (!title.trim()) {
    showDayPlanFeedback("Digite um titulo para o item do plano do dia.", "error");
    dom.dayPlanStandaloneInput?.focus();
    return;
  }

  updateDayPlanState((dayPlan) => ({
    ...dayPlan,
    items: [
      ...dayPlan.items,
      createStandaloneDayPlanItem(title, priority)
    ]
  }));

  dom.dayPlanStandaloneForm?.reset();
  if (dom.dayPlanStandalonePriority) {
    dom.dayPlanStandalonePriority.value = "M";
  }
  renderDayPlanUi();
  renderTaskRhythmUi();
  renderExecutionUi();
  showDayPlanFeedback("Item avulso adicionado ao plano do dia.", "success");
  dom.dayPlanStandaloneInput?.focus();
}

function handleDayPlanSourceSubmitRequest({ sourceValue, priority }) {
  if (!sourceValue) {
    showDayPlanFeedback("Escolha uma tarefa ou subtarefa para incluir no plano do dia.", "error");
    dom.dayPlanSourceSelect?.focus();
    return;
  }

  const nextItem = createLinkedDayPlanItem(sourceValue, priority);
  if (!nextItem) {
    showDayPlanFeedback("Nao foi possivel localizar a origem escolhida.", "error");
    return;
  }

  if (hasDayPlanLinkedSource(nextItem.sourceTaskId, nextItem.sourceSubtaskId)) {
    showDayPlanFeedback("Esse item de projeto ja esta no plano do dia.", "error");
    return;
  }

  updateDayPlanState((dayPlan) => ({
    ...dayPlan,
    items: [
      ...dayPlan.items,
      nextItem
    ]
  }));

  dom.dayPlanSourceForm?.reset();
  if (dom.dayPlanProjectFilter) {
    dom.dayPlanProjectFilter.value = appState.selectedDayPlanProjectFilterId;
  }
  if (dom.dayPlanSourcePriority) {
    dom.dayPlanSourcePriority.value = "M";
  }
  renderDayPlanUi();
  renderTaskRhythmUi();
  renderExecutionUi();
  showDayPlanFeedback("Item de projeto incluido no plano do dia.", "success");
  dom.dayPlanSourceSelect?.focus();
}

function handleDayPlanProjectFilterChangeRequest({ projectId }) {
  appState.selectedDayPlanProjectFilterId = projectId || "";
  renderDayPlanUi();
}

function handleSettingsSubmitRequest({ formData }) {
  const nextSettings = {
    ...appState.snapshot.settings,
    focusMinutes: formData.get("focusMinutes"),
    microBreakMinutes: formData.get("microBreakMinutes"),
    longBreakMinutes: formData.get("longBreakMinutes"),
    cyclesUntilLongBreak: formData.get("cyclesUntilLongBreak"),
    dailyTarget: formData.get("dailyTarget"),
    phaseEndSoundEnabled: formData.has("phaseEndSoundEnabled")
  };

  try {
    storage.set("cadencia.settings", nextSettings);
    appState.snapshot = storage.loadState();
    appState.todayHistory = getTodayHistoryFromSnapshot(appState.snapshot);
    timer.setSettings(appState.snapshot.settings);
    hydrateSettingsForm();
    renderTaskRhythmUi();
    renderExecutionUi();
    renderSummaryUi();
    renderDayProgressUi();
    showSettingsFeedback("Ajustes salvos.", "success");
  } catch (error) {
    console.error("Falha ao salvar ajustes.", error);
    showSettingsFeedback("Nao foi possivel salvar os ajustes.", "error");
  }
}

function handleBackupExportRequest() {
  try {
    const backupPayload = storage.createBackup();
    const downloadName = buildBackupFilename(backupPayload.exportedAt);
    const backupJson = JSON.stringify(backupPayload, null, 2);
    const blob = new Blob([backupJson], { type: "application/json" });
    const objectUrl = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = objectUrl;
    anchor.download = downloadName;
    anchor.click();

    window.setTimeout(() => {
      window.URL.revokeObjectURL(objectUrl);
    }, 0);

    showBackupFeedback("Backup exportado com sucesso.", "success");
  } catch (error) {
    console.error("Falha ao exportar backup.", error);
    showBackupFeedback("Nao foi possivel exportar o backup.", "error");
  }
}

async function handleBackupImportFileRequest({ file, input }) {
  if (!file) {
    return;
  }

  const confirmImport = window.confirm(
    `Importar o backup "${file.name}" e substituir os dados atuais do app?`
  );
  if (!confirmImport) {
    if (input) {
      input.value = "";
    }
    return;
  }

  try {
    const backupText = await file.text();
    const parsedPayload = JSON.parse(backupText);

    storage.restoreBackup(parsedPayload);
    appState.lastPersistedSessionKey = "";
    syncStateFromStore();
    hydrateSettingsForm();
    initializeTimer();
    renderTaskUi();
    renderDayPlanUi();
    renderProjectsUi();
    renderTaskRhythmUi();
    renderExecutionUi();
    renderSummaryUi();
    renderDayProgressUi();

    showBackupFeedback("Backup importado com sucesso.", "success");
  } catch (error) {
    console.error("Falha ao importar backup.", error);
    showBackupFeedback("Nao foi possivel importar este arquivo de backup.", "error");
  } finally {
    if (input) {
      input.value = "";
    }
  }
}

function handleClearAllRequest() {
  const confirmed = window.confirm(
    "Limpar todos os dados do app? Isso removera projetos, tarefas, subtarefas, plano do dia, historico, ritmo, execucao e ajustes salvos."
  );
  if (!confirmed) {
    return;
  }

  try {
    storage.resetState();
    appState.lastPersistedSessionKey = "";
    appState.collapsedProjectTaskIds.clear();
    appState.selectedProjectTreeId = "";
    appState.selectedDayPlanProjectFilterId = "";
    syncStateFromStore();
    hydrateSettingsForm();
    initializeTimer();
    renderTaskUi();
    renderDayPlanUi();
    renderProjectsUi();
    renderTaskRhythmUi();
    renderExecutionUi();
    renderSummaryUi();
    renderDayProgressUi();
    showBackupFeedback("Todos os dados foram limpos.", "success");
  } catch (error) {
    console.error("Falha ao limpar todos os dados.", error);
    showBackupFeedback("Nao foi possivel limpar os dados do app.", "error");
  }
}

function handleApplyFocusMinutesRequest() {
  const currentFocus = getCurrentFocusEntry();
  const focusedItemMinutes = getFocusedItemMinutes({
    currentFocus,
    tasks: appState.tasks,
    executionEntries: appState.execution.entries
  });
  if (!focusedItemMinutes) {
    return;
  }

  try {
    const snapshot = timer.applyFocusDuration(focusedItemMinutes);
    showTaskFeedback(
      getApplyFocusMinutesSuccessMessage(snapshot, focusedItemMinutes),
      "success"
    );
  } catch (error) {
    console.error("Falha ao aplicar o tempo do foco atual ao timer.", error);
    showTaskFeedback("Nao foi possivel aplicar o tempo do foco atual ao timer.", "error");
  }
}

function handleTaskActionRequest({ action, taskId, subtaskId }) {
  switch (action) {
    case "focus-task":
      toggleTaskFocus(taskId);
      return;
    case "remove-task":
      if (taskId && window.confirm("Remover esta tarefa?")) {
        applyTaskMutation(() => taskStore.removeTask(taskId), "Tarefa removida.");
      }
      return;
    case "edit-task":
      editTaskTitle(taskId);
      return;
    case "focus-subtask":
      toggleSubtaskFocus(taskId, subtaskId);
      return;
    case "open-task-rhythm":
      openTaskRhythm(taskId);
      return;
    case "remove-subtask":
      if (taskId && subtaskId && window.confirm("Remover esta subtarefa?")) {
        applyTaskMutation(() => taskStore.removeSubtask(taskId, subtaskId), "Subtarefa removida.");
      }
      return;
    case "edit-subtask":
      editSubtask(taskId, subtaskId);
      return;
    default:
      return;
  }
}

function handleTaskToggleRequest({ taskId }) {
  if (taskId) {
    applyTaskMutation(() => taskStore.toggleTask(taskId), "Tarefa atualizada.");
  }
}

function handleSubtaskToggleRequest({ taskId, subtaskId }) {
  if (taskId && subtaskId) {
    applyTaskMutation(() => taskStore.toggleSubtask(taskId, subtaskId), "Subtarefa atualizada.");
  }
}

function handleSubtaskSubmitRequest({ form, taskId, title, minutes }) {
  console.debug("[Cadencia] submit de subtarefa recebido.", {
    taskId
  });

  if (!taskId) {
    showTaskFeedback("Nao foi possivel identificar a tarefa.", "error");
    return;
  }

  if (!title.trim()) {
    showSubtaskFeedback(taskId, "Digite um titulo para a subtarefa.", "error", form.querySelector("[data-feedback-for-task]"));
    form.querySelector('input[name="subtaskTitle"]')?.focus();
    return;
  }

  const updatedTasks = applyTaskMutation(
    () => taskStore.addSubtask(taskId, title, minutes),
    "Subtarefa adicionada.",
    {
      skipDefaultFeedback: true,
      subtaskTaskId: taskId,
      subtaskFeedbackElement: form.querySelector("[data-feedback-for-task]")
    }
  );

  if (!updatedTasks) {
    return;
  }

  const updatedTask = updatedTasks.find((task) => task.id === taskId);
  const newSubtaskId = updatedTask?.subtasks.at(-1)?.id;

  highlightNewSubtask(taskId, newSubtaskId);
  showSubtaskFeedback(taskId, "Subtarefa adicionada com sucesso.", "success", form.querySelector("[data-feedback-for-task]"));
  form.querySelector('input[name="subtaskTitle"]')?.focus();
}

function handleProjectsActionRequest({ action, projectId, taskId, subtaskId }) {
  switch (action) {
    case "add-task":
      promptAddTaskToProject(projectId);
      return;
    case "duplicate-project":
      duplicateProjectFromExisting(projectId);
      return;
    case "add-subtask":
      promptAddSubtaskToTask(taskId);
      return;
    case "move-task":
      moveTaskToProject(taskId);
      return;
    case "focus-task":
      setTaskFocus(taskId);
      return;
    case "focus-subtask":
      setSubtaskFocus(taskId, subtaskId);
      return;
    case "open-task-rhythm":
      openTaskRhythm(taskId);
      return;
    case "open-subtask-rhythm":
      openSubtaskRhythm(taskId, subtaskId);
      return;
    case "toggle-task-branch":
      toggleProjectTaskBranch(taskId);
      return;
    case "edit-project":
      editProjectTitle(projectId);
      return;
    case "remove-project":
      removeProject(projectId);
      return;
    case "edit-task":
      editTaskTitle(taskId);
      return;
    case "remove-task":
      if (taskId && window.confirm("Remover esta tarefa?")) {
        applyTaskMutation(() => taskStore.removeTask(taskId), "Tarefa removida.");
      }
      return;
    case "edit-subtask":
      editSubtask(taskId, subtaskId);
      return;
    case "remove-subtask":
      if (taskId && subtaskId && window.confirm("Remover esta subtarefa?")) {
        applyTaskMutation(() => taskStore.removeSubtask(taskId, subtaskId), "Subtarefa removida.");
      }
      return;
    default:
      return;
  }
}

function promptAddTaskToProject(projectId) {
  const project = findProjectById(appState.projects, projectId);
  if (!project) {
    return;
  }

  const title = window.prompt("Nova tarefa para este projeto:", "");
  if (title === null) {
    return;
  }

  if (!title.trim()) {
    showTaskFeedback("Digite um titulo para a tarefa.", "error");
    return;
  }

  const updatedTasks = applyTaskMutation(
    () => taskStore.addTask(title, projectId),
    "Tarefa adicionada.",
    { skipDefaultFeedback: true }
  );

  if (!updatedTasks?.length) {
    return;
  }

  const newTask = updatedTasks.find((task) => task.projectId === projectId && task.title === title.trim()) || updatedTasks[0];
  highlightNewTask(newTask?.id);
  showTaskFeedback("Tarefa adicionada ao projeto.", "success");
  appState.selectedProjectTreeId = projectId;
  renderProjectsUi();
}

function duplicateProjectFromExisting(projectId) {
  const project = findProjectById(appState.projects, projectId);
  if (!project) {
    return;
  }

  const suggestedTitle = suggestDuplicatedProjectTitle(project.title);
  const nextTitle = window.prompt("Nome do novo projeto a partir desta estrutura:", suggestedTitle);
  if (nextTitle === null) {
    return;
  }

  if (!nextTitle.trim()) {
    showProjectFeedback("Digite um nome para o projeto duplicado.", "error");
    return;
  }

  if (appState.projects.some((entry) => entry.title.toLowerCase() === nextTitle.trim().toLowerCase())) {
    showProjectFeedback("Ja existe um projeto com esse nome.", "error");
    return;
  }

  const duplicationResult = applyProjectMutation(
    () => taskStore.duplicateProject(projectId, nextTitle),
    "Projeto duplicado com sucesso."
  );
  if (!duplicationResult?.project?.id) {
    showProjectFeedback("Nao foi possivel duplicar este projeto.", "error");
    return;
  }

  appState.selectedProjectTreeId = duplicationResult.project.id;
  renderProjectsUi();
  showProjectFeedback(
    `Projeto duplicado com ${duplicationResult.taskCount} tarefa${duplicationResult.taskCount === 1 ? "" : "s"}.`,
    "success"
  );
}

function promptAddSubtaskToTask(taskId) {
  const task = findTaskById(appState.tasks, taskId);
  if (!task) {
    return;
  }

  const title = window.prompt(`Nova subtarefa para \"${task.title}\":`, "");
  if (title === null) {
    return;
  }

  if (!title.trim()) {
    showTaskFeedback("Digite um titulo para a subtarefa.", "error");
    return;
  }

  const minutes = window.prompt("Tempo de referencia em minutos:", "15");
  if (minutes === null) {
    return;
  }

  const updatedTasks = applyTaskMutation(
    () => taskStore.addSubtask(taskId, title, minutes),
    "Subtarefa adicionada.",
    { skipDefaultFeedback: true }
  );

  if (!updatedTasks?.length) {
    return;
  }

  const updatedTask = updatedTasks.find((entry) => entry.id === taskId);
  const newSubtaskId = updatedTask?.subtasks.at(-1)?.id;
  if (taskId) {
    appState.collapsedProjectTaskIds.delete(taskId);
  }
  highlightNewSubtask(taskId, newSubtaskId);
  showTaskFeedback("Subtarefa adicionada a tarefa.", "success");
  renderProjectsUi();
}

function moveTaskToProject(taskId) {
  const task = findTaskById(appState.tasks, taskId);
  if (!task) {
    return;
  }

  const nextProjectId = promptProjectSelection(task.projectId, {
    introLabel: `Mover "${task.title}" para qual projeto?`
  });

  if (typeof nextProjectId === "undefined") {
    return;
  }

  if (areEquivalentProjectTargets(task.projectId, nextProjectId)) {
    return;
  }

  const updatedTasks = applyTaskMutation(
    () => taskStore.updateTask(taskId, { projectId: nextProjectId }),
    "Tarefa movida.",
    { skipDefaultFeedback: true }
  );

  if (!updatedTasks?.length) {
    return;
  }

  const resolvedProjectId = nextProjectId || PROVISIONAL_PROJECT_ID;
  appState.selectedProjectTreeId = resolvedProjectId;
  renderProjectsUi();

  const destinationProject = appState.projects.find((project) => project.id === resolvedProjectId);
  showTaskFeedback(
    `Tarefa movida para "${destinationProject?.title || "Sem projeto"}".`,
    "success"
  );
}

function openSubtaskRhythm(taskId, subtaskId) {
  if (!taskId || !subtaskId) {
    return;
  }

  setSubtaskFocus(taskId, subtaskId);
  appState.activeTaskRhythmView = "rhythm";
  setActiveTab("task-rhythm");
}

function openTaskRhythm(taskId) {
  if (!taskId) {
    return;
  }

  setTaskFocus(taskId);
  appState.activeTaskRhythmView = "rhythm";
  setActiveTab("task-rhythm");
}

function handleTaskRhythmViewChangeRequest({ view }) {
  appState.activeTaskRhythmView = view === "execution" ? "execution" : "rhythm";
  renderTaskRhythmUi();
}

function handleProjectsTaskToggleRequest({ taskId }) {
  if (taskId) {
    applyTaskMutation(() => taskStore.toggleTask(taskId), "Tarefa atualizada.");
  }
}

function handleProjectsSubtaskToggleRequest({ taskId, subtaskId }) {
  if (taskId && subtaskId) {
    applyTaskMutation(() => taskStore.toggleSubtask(taskId, subtaskId), "Subtarefa atualizada.");
  }
}

function handleDayPlanActionRequest({ action, itemId }) {
  const item = getDayPlanItemById(itemId);
  if (!item) {
    return;
  }

  switch (action) {
    case "focus-item":
      focusDayPlanItem(item);
      return;
    case "remove-item":
      removeDayPlanItem(item.id);
      return;
    default:
      return;
  }
}

function handleDayPlanToggleRequest({ itemId }) {
  const item = getDayPlanItemById(itemId);
  if (!item) {
    return;
  }

  if (item.kind === "task") {
    applyTaskMutation(() => taskStore.toggleTask(item.sourceTaskId), "Tarefa atualizada.");
    return;
  }

  if (item.kind === "subtask") {
    applyTaskMutation(
      () => taskStore.toggleSubtask(item.sourceTaskId, item.sourceSubtaskId),
      "Subtarefa atualizada."
    );
    return;
  }

  updateDayPlanState((dayPlan) => ({
    ...dayPlan,
    items: dayPlan.items.map((entry) => (
      entry.id === itemId
        ? { ...entry, completed: !entry.completed }
        : entry
    )),
    activeItemId: dayPlan.activeItemId === itemId && !item.completed ? null : dayPlan.activeItemId
  }));
  renderTaskUi();
  renderTaskRhythmUi();
  renderExecutionUi();
  renderSummaryUi();
  renderDayProgressUi();
  renderDayPlanUi();
  updateContextTip();
}

function handleDayPlanPriorityChangeRequest({ itemId, priority }) {
  updateDayPlanState((dayPlan) => ({
    ...dayPlan,
    items: dayPlan.items.map((item) => (
      item.id === itemId
        ? { ...item, priority: normalizeDayPlanPriority(priority) }
        : item
    ))
  }));
  renderTaskUi();
  renderTaskRhythmUi();
  renderExecutionUi();
  renderSummaryUi();
  renderDayProgressUi();
  renderDayPlanUi();
  updateContextTip();
}

function handleExecutionSubmitRequest(nextEntry) {
  const currentFocus = getCurrentFocusEntry();
  const executionKey = getFocusKey(currentFocus);
  if (!executionKey) {
    showExecutionFeedback("Escolha uma tarefa ou subtarefa em foco antes de salvar a execucao.", "error");
    return;
  }

  const previousEntry = appState.execution.entries[executionKey] ?? createEmptyExecutionEntry();
  updateExecutionState((execution) => ({
    ...execution,
    entries: {
      ...execution.entries,
      [executionKey]: {
        ...previousEntry,
        mode: normalizeExecutionMode(nextEntry.mode),
        materials: normalizeExecutionText(nextEntry.materials),
        actions: normalizeExecutionActions(nextEntry.actions),
        contacts: normalizeExecutionText(nextEntry.contacts),
        phones: normalizeExecutionText(nextEntry.phones),
        notes: normalizeExecutionText(nextEntry.notes),
        instructions: normalizeExecutionText(nextEntry.instructions),
        updatedAt: new Date().toISOString()
      }
    }
  }));
  renderTaskRhythmUi();
  showExecutionFeedback("Plano de execucao salvo com sucesso.", "success");
}

function handleTaskRhythmSubmitRequest({ formData }) {
  const currentFocus = getCurrentFocusEntry();
  if (!currentFocus || currentFocus.kind === "standalone") {
    showExecutionFeedback("Escolha uma tarefa ou subtarefa vinculada para editar o ritmo.", "error");
    return;
  }

  const title = String(formData.get("title") ?? "").trim();
  if (!title) {
    showExecutionFeedback("Digite um nome valido para o foco atual.", "error");
    return;
  }

  const nextStepNote = String(formData.get("nextStepNote") ?? "");
  const cognitiveProfile = {
    startEase: formData.get("startEase"),
    anxietyLevel: formData.get("anxietyLevel"),
    perceivedLoad: formData.get("perceivedLoad")
  };

  const mutation = currentFocus.kind === "subtask"
    ? () => taskStore.updateSubtask(
      currentFocus.sourceTaskId || currentFocus.taskId,
      currentFocus.sourceSubtaskId || currentFocus.subtaskId,
      {
        title,
        minutes: formData.get("minutes"),
        nextStepNote,
        cognitiveProfile
      }
    )
    : () => taskStore.updateTask(
      currentFocus.sourceTaskId || currentFocus.taskId,
      {
        title,
        nextStepNote,
        cognitiveProfile
      }
    );

  const updatedTasks = applyTaskMutation(mutation, "Ritmo atualizado.", {
    skipDefaultFeedback: true
  });
  if (!updatedTasks) {
    return;
  }

  const executionKey = getFocusKey(currentFocus);
  if (executionKey) {
    const previousEntry = appState.execution.entries[executionKey] ?? createEmptyExecutionEntry();
    updateExecutionState((execution) => ({
      ...execution,
      entries: {
        ...execution.entries,
        [executionKey]: {
          ...previousEntry,
          expectedMinutesOverride: currentFocus.kind === "task"
            ? normalizeOptionalPositiveInteger(formData.get("expectedMinutesOverride"))
            : previousEntry.expectedMinutesOverride,
          focusMinutesOverride: normalizeOptionalPositiveInteger(formData.get("focusMinutesOverride")),
          shortBreakMinutesOverride: normalizeOptionalPositiveInteger(formData.get("shortBreakMinutesOverride")),
          longBreakMinutesOverride: normalizeOptionalPositiveInteger(formData.get("longBreakMinutesOverride")),
          manualCycles: normalizeOptionalPositiveInteger(formData.get("manualCycles")),
          updatedAt: new Date().toISOString()
        }
      }
    }));
  }

  showExecutionFeedback("Informacoes de ritmo salvas.", "success");
}

function applyTaskMutation(mutation, successMessage, options = {}) {
  try {
    const mutationResult = mutation();
    syncStateFromStore();
    renderTaskUi();
    renderDayPlanUi();
    renderProjectsUi();
    renderTaskRhythmUi();
    renderExecutionUi();
    renderSummaryUi();
    renderDayProgressUi();
    updateContextTip();

    console.debug("[Cadencia] tarefa atualizada com sucesso.", {
      totalTasks: appState.taskSummary?.total ?? appState.tasks.length,
      successMessage,
      mutationResult
    });

    if (!options.skipDefaultFeedback) {
      showTaskFeedback(successMessage, "success");
    }

    return mutationResult;
  } catch (error) {
    console.error("Falha ao atualizar tarefas.", error);

    if (options.subtaskTaskId) {
      showSubtaskFeedback(
        options.subtaskTaskId,
        "Nao foi possivel atualizar as subtarefas.",
        "error",
        options.subtaskFeedbackElement
      );
    } else {
      showTaskFeedback("Nao foi possivel atualizar as tarefas.", "error");
    }

    return null;
  }
}

function applyProjectMutation(mutation, successMessage) {
  try {
    const mutationResult = mutation();
    syncStateFromStore();
    renderTaskUi();
    renderDayPlanUi();
    renderProjectsUi();
    renderTaskRhythmUi();
    renderExecutionUi();
    renderSummaryUi();
    renderDayProgressUi();
    updateContextTip();
    showProjectFeedback(successMessage, "success");
    return mutationResult;
  } catch (error) {
    console.error("Falha ao atualizar projetos.", error);
    showProjectFeedback("Nao foi possivel atualizar os projetos.", "error");
    return null;
  }
}

function toggleTaskFocus(taskId) {
  clearStandaloneDayPlanFocus();
  const task = findTaskById(appState.tasks, taskId);
  if (!task) {
    return;
  }

  const mutation = task.isFocus && !task.subtasks.some((subtask) => subtask.isFocus)
    ? () => taskStore.clearFocus()
    : () => taskStore.setFocus(taskId);

  applyTaskMutation(mutation, "Foco atualizado.");
}

function setTaskFocus(taskId) {
  clearStandaloneDayPlanFocus();
  const task = findTaskById(appState.tasks, taskId);
  if (!task || task.completed) {
    return;
  }

  applyTaskMutation(() => taskStore.setFocus(taskId), "Foco atualizado.");
}

function toggleSubtaskFocus(taskId, subtaskId) {
  clearStandaloneDayPlanFocus();
  const selection = findTaskSelection(appState.tasks, taskId, subtaskId);
  if (!selection) {
    return;
  }

  const mutation = selection.subtask.isFocus
    ? () => taskStore.clearFocus()
    : () => taskStore.setFocus(taskId, subtaskId);

  applyTaskMutation(mutation, "Foco atualizado.");
}

function setSubtaskFocus(taskId, subtaskId) {
  clearStandaloneDayPlanFocus();
  const selection = findTaskSelection(appState.tasks, taskId, subtaskId);
  if (!selection || selection.subtask.completed) {
    return;
  }

  applyTaskMutation(() => taskStore.setFocus(taskId, subtaskId), "Foco atualizado.");
}

function editTaskTitle(taskId) {
  const task = findTaskById(appState.tasks, taskId);
  if (!task) {
    return;
  }

  const nextTitle = window.prompt("Novo titulo da tarefa:", task.title);
  if (nextTitle === null) {
    return;
  }

  if (!nextTitle.trim()) {
    showTaskFeedback("O titulo da tarefa nao pode ficar vazio.", "error");
    return;
  }

  const nextProjectId = promptProjectSelection(task.projectId);
  if (nextProjectId === undefined) {
    return;
  }

  applyTaskMutation(
    () => taskStore.updateTask(taskId, { title: nextTitle, projectId: nextProjectId }),
    "Tarefa atualizada."
  );
}

function editProjectTitle(projectId) {
  const project = findProjectById(appState.projects, projectId);
  if (!project) {
    return;
  }

  const nextTitle = window.prompt("Novo nome do projeto:", project.title);
  if (nextTitle === null) {
    return;
  }

  if (!nextTitle.trim()) {
    showProjectFeedback("O nome do projeto nao pode ficar vazio.", "error");
    return;
  }

  const nextColor = window.prompt("Cor principal do projeto (#RRGGBB):", project.color || DEFAULT_PROJECT_COLOR);
  if (nextColor === null) {
    return;
  }

  if (!isValidProjectColor(nextColor)) {
    showProjectFeedback("Digite uma cor valida no formato #RRGGBB.", "error");
    return;
  }

  if (appState.projects.some((entry) => entry.id !== projectId && entry.title.toLowerCase() === nextTitle.trim().toLowerCase())) {
    showProjectFeedback("Ja existe um projeto com esse nome.", "error");
    return;
  }

  applyProjectMutation(
    () => taskStore.updateProject(projectId, { title: nextTitle, color: nextColor.trim().toUpperCase() }),
    "Projeto atualizado."
  );
}

function removeProject(projectId) {
  const project = findProjectById(appState.projects, projectId);
  if (!project) {
    return;
  }

  const linkedTasksCount = appState.tasks.filter((task) => task.projectId === projectId).length;
  const confirmed = window.confirm(
    linkedTasksCount > 0
      ? `Excluir o projeto "${project.title}"? As ${linkedTasksCount} tarefas vinculadas continuarao existindo e irao para o projeto provisório "Sem projeto".`
      : `Excluir o projeto "${project.title}"?`
  );
  if (!confirmed) {
    return;
  }

  applyProjectMutation(() => taskStore.removeProject(projectId), "Projeto removido com seguranca.");
}

function editSubtask(taskId, subtaskId) {
  const selection = findTaskSelection(appState.tasks, taskId, subtaskId);
  if (!selection) {
    return;
  }

  const nextTitle = window.prompt("Novo titulo da subtarefa:", selection.subtask.title);
  if (nextTitle === null) {
    return;
  }

  if (!nextTitle.trim()) {
    showTaskFeedback("O titulo da subtarefa nao pode ficar vazio.", "error");
    return;
  }

  const nextMinutes = window.prompt(
    "Tempo de referencia em minutos:",
    String(selection.subtask.minutes)
  );
  if (nextMinutes === null) {
    return;
  }

  applyTaskMutation(
    () => taskStore.updateSubtask(taskId, subtaskId, { title: nextTitle, minutes: nextMinutes }),
    "Subtarefa atualizada."
  );
}

function syncStateFromStore() {
  appState.snapshot = storage.loadState();
  taskStore.reload?.();
  appState.projects = taskStore.getProjects();
  appState.dayPlan = appState.snapshot.dayPlan;
  appState.execution = appState.snapshot.execution;
  appState.tasks = taskStore.getTasks();
  appState.taskSummary = taskStore.getSummary();
  appState.todayHistory = getTodayHistoryFromSnapshot(appState.snapshot);
}

function toggleProjectTaskBranch(taskId) {
  if (!taskId) {
    return;
  }

  if (appState.collapsedProjectTaskIds.has(taskId)) {
    appState.collapsedProjectTaskIds.delete(taskId);
  } else {
    appState.collapsedProjectTaskIds.add(taskId);
  }

  renderProjectsUi();
}

function renderTaskUi() {
  const currentSession = appState.snapshot?.currentSession ?? timer.getSnapshot();
  const currentFocus = getCurrentFocusEntry();
  renderTaskProjectOptions();

  renderTaskSection({
    dom: {
      taskSummary: dom.taskSummary,
      taskFocusLabel: dom.taskFocusLabel,
      taskFocusCaption: dom.taskFocusCaption,
      focusTimeHelper: dom.focusTimeHelper,
      focusTimeHelperText: dom.focusTimeHelperText,
      applyFocusMinutesButton: dom.applyFocusMinutesButton,
      taskList: dom.taskList
    },
    taskSummary: appState.taskSummary,
    currentFocus,
    tasks: appState.tasks,
    projects: appState.projects,
    session: currentSession,
    focusedItemMinutes: getFocusedItemMinutes({
      currentFocus,
      tasks: appState.tasks,
      executionEntries: appState.execution.entries
    }),
    reservedFocusMinutes: getReservedFocusMinutes(currentSession),
    getFocusTimeHelperText
  });
}

function renderDayPlanUi() {
  renderDayPlanSection({
    dom: {
      dayPlanSummary: dom.dayPlanSummary,
      dayPlanProjectFilter: dom.dayPlanProjectFilter,
      dayPlanSourceSelect: dom.dayPlanSourceSelect,
      dayPlanManageList: dom.dayPlanManageList,
      dayPlanList: dom.dayPlanList
    },
    dayPlan: appState.dayPlan,
    tasks: appState.tasks,
    projects: appState.projects,
    currentFocus: getCurrentFocusEntry(),
    executionEntries: appState.execution.entries,
    selectedProjectId: appState.selectedDayPlanProjectFilterId
  });
}

function renderProjectsUi() {
  syncProjectsTreeSelection();
  renderTaskProjectOptions();
  renderProjectsTreeOptions();

  renderProjectsSection({
    dom: {
      projectsTree: dom.projectsTree,
      projectsSummary: dom.projectsSummary
    },
    tasks: appState.tasks,
    projects: appState.projects,
    collapsedTaskIds: appState.collapsedProjectTaskIds,
    selectedProjectId: appState.selectedProjectTreeId
  });
}

function renderTaskRhythmUi() {
  const currentSession = appState.snapshot?.currentSession ?? timer.getSnapshot();
  const currentFocus = getCurrentFocusEntry();
  const executionEntry = getCurrentExecutionEntry(currentFocus);
  const selection = currentFocus?.kind === "subtask"
    ? findTaskSelection(
      appState.tasks,
      currentFocus.sourceTaskId || currentFocus.taskId,
      currentFocus.sourceSubtaskId || currentFocus.subtaskId
    )
    : null;
  const sourceTask = currentFocus?.kind === "task"
    ? findTaskById(appState.tasks, currentFocus.sourceTaskId || currentFocus.taskId)
    : selection?.task ?? null;
  const sourceSubtask = selection?.subtask ?? null;

  renderTaskRhythmSection({
    dom: {
      taskRhythmContent: dom.taskRhythmContent
    },
    activeView: appState.activeTaskRhythmView,
    view: buildTaskRhythmView({
      currentFocus,
      tasks: appState.tasks,
      projects: appState.projects,
      session: currentSession,
      settings: appState.snapshot?.settings,
      executionEntry
    }),
    execution: {
      currentFocus,
      executionEntry,
      projectTitle: getExecutionProjectTitle(currentFocus, sourceTask, sourceSubtask, appState.projects),
      statusLabel: getExecutionStatusLabel(currentFocus, sourceTask, sourceSubtask),
      expectedTime: getExecutionExpectedTime(currentFocus, sourceTask, sourceSubtask, executionEntry)
    }
  });
}

function renderExecutionUi() {
  return;
}

function renderTaskFocusTimeUi() {
  const currentSession = appState.snapshot?.currentSession ?? timer.getSnapshot();
  const currentFocus = getCurrentFocusEntry();

  renderTaskFocusTimeHelper({
    dom: {
      focusTimeHelper: dom.focusTimeHelper,
      focusTimeHelperText: dom.focusTimeHelperText,
      applyFocusMinutesButton: dom.applyFocusMinutesButton
    },
    session: currentSession,
    focusedItemMinutes: getFocusedItemMinutes({
      currentFocus,
      tasks: appState.tasks,
      executionEntries: appState.execution.entries
    }),
    reservedFocusMinutes: getReservedFocusMinutes(currentSession),
    getFocusTimeHelperText
  });
}

function handleTimerPhaseChange(phase) {
  dom.body.dataset.phase = phase.id;

  if (dom.currentMode) {
    dom.currentMode.textContent = phase.label;
  }

  if (dom.phaseHint) {
    dom.phaseHint.textContent = getPhaseHint(phase.id);
  }

  updateContextTip();
}

function handleTimerStateChange(status, snapshot) {
  if (dom.timerStatus) {
    dom.timerStatus.textContent = getTimerStatusText(status, snapshot);
  }

  if (dom.startButton) {
    dom.startButton.disabled = status === "running";
  }

  if (dom.pauseButton) {
    dom.pauseButton.disabled = status !== "running";
  }

  if (dom.resetButton) {
    dom.resetButton.disabled = status === "idle" && snapshot.remainingSeconds === snapshot.durationSeconds;
  }
}

function handleTimerTick(remainingSeconds, snapshot) {
  if (dom.timerDisplay) {
    dom.timerDisplay.textContent = formatDuration(remainingSeconds);
  }

  if (dom.phaseHint) {
    dom.phaseHint.textContent = getPhaseHint(snapshot.phaseId);
  }
}

function handleTimerSessionChange(snapshot) {
  appState.snapshot.currentSession = snapshot;
  persistSessionSnapshot(snapshot);
  renderTaskFocusTimeUi();
  renderTaskRhythmUi();
  renderExecutionUi();
}

function handlePhaseComplete(phase, completedSession) {
  const shouldPlayPhaseEndSound = Boolean(appState.snapshot?.settings?.phaseEndSoundEnabled);
  const focusedMinutes = phase.id === "focus"
    ? Math.round(completedSession.durationSeconds / 60)
    : 0;

  storage.recordPhaseCompletion(phase.id, { focusedMinutes });
  appState.snapshot = storage.loadState();
  appState.todayHistory = getTodayHistoryFromSnapshot(appState.snapshot);
  renderTaskRhythmUi();
  renderExecutionUi();
  renderSummaryUi();
  renderDayProgressUi();

  if (shouldPlayPhaseEndSound) {
    phaseEndSound.play().catch(() => {});
  }
}

function persistSessionSnapshot(snapshot) {
  const sessionKey = [
    snapshot.phaseId,
    snapshot.status,
    snapshot.remainingSeconds,
    snapshot.completedFocusCycles,
    snapshot.focusCyclesSinceLongBreak,
    snapshot.nextFocusDurationSeconds
  ].join("|");

  const shouldPersist =
    snapshot.status !== "running" ||
    snapshot.remainingSeconds === snapshot.durationSeconds ||
    snapshot.remainingSeconds === 0 ||
    snapshot.remainingSeconds % 5 === 0;

  if (!shouldPersist || sessionKey === appState.lastPersistedSessionKey) {
    return;
  }

  storage.set("cadencia.session", snapshot);
  appState.lastPersistedSessionKey = sessionKey;
}

function renderCurrentDate() {
  if (!dom.currentDate) {
    return;
  }

  dom.currentDate.textContent = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short"
  }).format(new Date());
}

function suggestDuplicatedProjectTitle(baseTitle) {
  const normalizedBaseTitle = String(baseTitle || "").trim() || "Projeto";
  const baseCopyTitle = `${normalizedBaseTitle} - copia`;

  if (!appState.projects.some((project) => project.title.toLowerCase() === baseCopyTitle.toLowerCase())) {
    return baseCopyTitle;
  }

  let index = 2;
  let nextTitle = `${normalizedBaseTitle} - copia ${index}`;
  while (appState.projects.some((project) => project.title.toLowerCase() === nextTitle.toLowerCase())) {
    index += 1;
    nextTitle = `${normalizedBaseTitle} - copia ${index}`;
  }

  return nextTitle;
}

function buildBackupFilename(exportedAt) {
  const sourceDate = exportedAt ? new Date(exportedAt) : new Date();
  const year = sourceDate.getFullYear();
  const month = String(sourceDate.getMonth() + 1).padStart(2, "0");
  const day = String(sourceDate.getDate()).padStart(2, "0");
  const hours = String(sourceDate.getHours()).padStart(2, "0");
  const minutes = String(sourceDate.getMinutes()).padStart(2, "0");
  const seconds = String(sourceDate.getSeconds()).padStart(2, "0");

  return `cadencia-backup-${year}-${month}-${day}_${hours}-${minutes}-${seconds}.json`;
}

function hydrateSettingsForm() {
  if (!dom.settingsForm || !appState.snapshot) {
    return;
  }

  const { settings } = appState.snapshot;
  dom.settingsForm.elements.focusMinutes.value = String(settings.focusMinutes);
  dom.settingsForm.elements.microBreakMinutes.value = String(settings.microBreakMinutes);
  dom.settingsForm.elements.longBreakMinutes.value = String(settings.longBreakMinutes);
  dom.settingsForm.elements.cyclesUntilLongBreak.value = String(settings.cyclesUntilLongBreak);
  dom.settingsForm.elements.dailyTarget.value = String(settings.dailyTarget);
  dom.settingsForm.elements.phaseEndSoundEnabled.checked = Boolean(settings.phaseEndSoundEnabled);
}

function preparePhaseEndSound() {
  phaseEndSound.prime().catch(() => {});
}

function renderTaskProjectOptions() {
  if (!dom.taskProjectSelect) {
    return;
  }

  renderProjectSelectOptions(dom.taskProjectSelect);
}

function renderProjectsTreeOptions() {
  if (!dom.projectsTreeSelect) {
    return;
  }

  const currentValue = appState.selectedProjectTreeId;
  dom.projectsTreeSelect.innerHTML = "";

  if (appState.projects.length === 0) {
    dom.projectsTreeSelect.appendChild(new Option("Nenhum projeto disponivel", ""));
    dom.projectsTreeSelect.value = "";
    dom.projectsTreeSelect.disabled = true;
    return;
  }

  dom.projectsTreeSelect.disabled = false;
  appState.projects.forEach((project) => {
    dom.projectsTreeSelect.appendChild(new Option(project.title, project.id));
  });

  dom.projectsTreeSelect.value = appState.projects.some((project) => project.id === currentValue)
    ? currentValue
    : appState.projects[0].id;
}

function renderProjectSelectOptions(selectElement) {
  if (!selectElement) {
    return;
  }

  const currentValue = selectElement.value;
  selectElement.innerHTML = "";
  selectElement.appendChild(new Option("Sem projeto", ""));

  appState.projects.forEach((project) => {
    selectElement.appendChild(new Option(project.title, project.id));
  });

  selectElement.value = appState.projects.some((project) => project.id === currentValue)
    ? currentValue
    : "";
}

function syncProjectsTreeSelection() {
  if (appState.projects.length === 0) {
    appState.selectedProjectTreeId = "";
    return;
  }

  if (appState.projects.some((project) => project.id === appState.selectedProjectTreeId)) {
    return;
  }

  appState.selectedProjectTreeId = appState.projects[0].id;
}

function isValidProjectColor(value) {
  return typeof value === "string" && /^#([0-9a-fA-F]{6})$/.test(value.trim());
}

function renderSummaryUi() {
  renderSummarySection({
    dom: {
      summarySessionsToday: dom.summarySessionsToday,
      summaryMinutesToday: dom.summaryMinutesToday,
      summaryCurrentTask: dom.summaryCurrentTask,
      summaryCurrentSubtask: dom.summaryCurrentSubtask
    },
    todayHistory: appState.todayHistory,
    currentFocus: getCurrentFocusEntry()
  });
}

function renderDayProgressUi() {
  renderDayProgressSection({
    dom: {
      dayProgressContent: dom.dayProgressContent
    },
    view: buildDayProgressView({
      currentFocus: getCurrentFocusEntry(),
      settings: appState.snapshot?.settings,
      tasks: appState.tasks,
      todayHistory: appState.todayHistory
    })
  });
}

function updateContextTip() {
  if (!dom.contextTip) {
    return;
  }

  const currentPhaseId = appState.snapshot?.currentSession?.phaseId || "focus";
  dom.contextTip.textContent = getContextTip(currentPhaseId, getCurrentFocusEntry());
}

function createStandaloneDayPlanItem(title, priority) {
  return {
    id: createDayPlanItemId(),
    kind: "standalone",
    title: title.trim(),
    priority: normalizeDayPlanPriority(priority),
    completed: false,
    sourceTaskId: null,
    sourceSubtaskId: null,
    createdAt: new Date().toISOString()
  };
}

function createLinkedDayPlanItem(sourceValue, priority) {
  const parsedSource = parseDayPlanSourceValue(sourceValue);
  if (!parsedSource) {
    return null;
  }

  if (parsedSource.kind === "task") {
    const task = findTaskById(appState.tasks, parsedSource.taskId);
    if (!task) {
      return null;
    }

    return {
      id: createDayPlanItemId(),
      kind: "task",
      title: task.title,
      priority: normalizeDayPlanPriority(priority),
      completed: task.completed,
      sourceTaskId: task.id,
      sourceSubtaskId: null,
      createdAt: new Date().toISOString()
    };
  }

  const selection = findTaskSelection(appState.tasks, parsedSource.taskId, parsedSource.subtaskId);
  if (!selection) {
    return null;
  }

  return {
    id: createDayPlanItemId(),
    kind: "subtask",
    title: selection.subtask.title,
    priority: normalizeDayPlanPriority(priority),
    completed: selection.subtask.completed,
    sourceTaskId: parsedSource.taskId,
    sourceSubtaskId: parsedSource.subtaskId,
    createdAt: new Date().toISOString()
  };
}

function updateDayPlanState(updater) {
  const nextDayPlan = typeof updater === "function"
    ? updater(appState.dayPlan)
    : updater;

  storage.set(DAY_PLAN_STORAGE_KEY, nextDayPlan);
  appState.snapshot = storage.loadState();
  appState.dayPlan = appState.snapshot.dayPlan;
}

function updateExecutionState(updater) {
  const nextExecution = typeof updater === "function"
    ? updater(appState.execution)
    : updater;

  storage.set("cadencia.execution", nextExecution);
  appState.snapshot = storage.loadState();
  appState.execution = appState.snapshot.execution;
}

function focusDayPlanItem(item) {
  if (item.kind === "standalone") {
    applyTaskMutation(() => taskStore.clearFocus(), "Foco atualizado.", {
      skipDefaultFeedback: true
    });
    updateDayPlanState((dayPlan) => ({
      ...dayPlan,
      activeItemId: item.id
    }));
    renderTaskUi();
    renderTaskRhythmUi();
    renderExecutionUi();
    renderSummaryUi();
    renderDayPlanUi();
    updateContextTip();
    showDayPlanFeedback("Foco atual definido a partir do plano do dia.", "success");
    return;
  }

  clearStandaloneDayPlanFocus();

  if (item.kind === "task") {
    setTaskFocus(item.sourceTaskId);
  } else {
    setSubtaskFocus(item.sourceTaskId, item.sourceSubtaskId);
  }
}

function removeDayPlanItem(itemId) {
  const activeStandaloneRemoved = appState.dayPlan.activeItemId === itemId &&
    getDayPlanItemById(itemId)?.kind === "standalone";

  updateDayPlanState((dayPlan) => ({
    ...dayPlan,
    items: dayPlan.items.filter((item) => item.id !== itemId),
    activeItemId: dayPlan.activeItemId === itemId ? null : dayPlan.activeItemId
  }));
  if (activeStandaloneRemoved) {
    renderTaskUi();
    renderTaskRhythmUi();
    renderExecutionUi();
    renderSummaryUi();
    renderDayProgressUi();
    updateContextTip();
  }
  renderDayPlanUi();
}

function clearStandaloneDayPlanFocus() {
  const activeItem = getStandaloneDayPlanFocus(appState.dayPlan);
  if (!activeItem) {
    return;
  }

  updateDayPlanState((dayPlan) => ({
    ...dayPlan,
    activeItemId: null
  }));
  renderDayPlanUi();
  renderTaskRhythmUi();
  renderExecutionUi();
  renderDayProgressUi();
}

function getDayPlanItemById(itemId) {
  if (!itemId) {
    return null;
  }

  return appState.dayPlan.items.find((item) => item.id === itemId) ?? null;
}

function getActiveDayPlanItem() {
  return getStandaloneDayPlanFocus(appState.dayPlan);
}

function hasDayPlanLinkedSource(sourceTaskId, sourceSubtaskId) {
  return appState.dayPlan.items.some((item) =>
    item.kind !== "standalone" &&
    item.sourceTaskId === sourceTaskId &&
    item.sourceSubtaskId === (sourceSubtaskId || null)
  );
}

function getCurrentFocusEntry() {
  return resolveCurrentFocus({
    taskSummary: appState.taskSummary,
    dayPlan: appState.dayPlan
  });
}

function getCurrentExecutionEntry(currentFocus) {
  const executionKey = getExecutionFocusKey(currentFocus);
  if (!executionKey) {
    return createEmptyExecutionEntry();
  }

  return appState.execution.entries[executionKey] ?? createEmptyExecutionEntry();
}

function getExecutionFocusKey(currentFocus) {
  return getFocusKey(currentFocus);
}

function parseDayPlanSourceValue(sourceValue) {
  if (!sourceValue) {
    return null;
  }

  const [kind, taskId, subtaskId] = sourceValue.split(":");
  if (kind === "task" && taskId) {
    return { kind, taskId };
  }

  if (kind === "subtask" && taskId && subtaskId) {
    return { kind, taskId, subtaskId };
  }

  return null;
}

function normalizeDayPlanPriority(priority) {
  return ["A", "M", "B"].includes(priority) ? priority : "M";
}

function createDayPlanItemId() {
  const stamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 8);
  return `day-plan-${stamp}-${random}`;
}

function createEmptyExecutionEntry() {
  return {
    mode: "solo",
    materials: "",
    actions: [],
    contacts: "",
    phones: "",
    notes: "",
    instructions: "",
    expectedMinutesOverride: null,
    focusMinutesOverride: null,
    shortBreakMinutesOverride: null,
    longBreakMinutesOverride: null,
    manualCycles: null,
    updatedAt: null
  };
}

function normalizeExecutionMode(mode) {
  return ["solo", "meeting"].includes(mode) ? mode : "solo";
}

function normalizeExecutionActions(actions) {
  const allowedActions = new Set([
    "email",
    "phone-call",
    "meeting",
    "reading",
    "writing",
    "document-send",
    "visit",
    "experimental-practice"
  ]);

  return Array.isArray(actions)
    ? actions.filter((action) => allowedActions.has(action))
    : [];
}

function normalizeExecutionText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeOptionalPositiveInteger(value) {
  if (value === null || typeof value === "undefined" || String(value).trim() === "") {
    return null;
  }

  const numericValue = Number(value);
  if (!Number.isInteger(numericValue) || numericValue <= 0) {
    return null;
  }

  return numericValue;
}

function promptProjectSelection(currentProjectId, options = {}) {
  if (appState.projects.length === 0) {
    return null;
  }

  const selectableProjects = appState.projects.filter((project) => project.id !== PROVISIONAL_PROJECT_ID);

  const promptLines = [
    options.introLabel || "Escolha o projeto da tarefa:",
    "0 - Sem projeto (provisorio)",
    ...selectableProjects.map((project, index) => `${index + 1} - ${project.title}`)
  ];
  const defaultIndex =
    !currentProjectId || currentProjectId === PROVISIONAL_PROJECT_ID
      ? 0
      : selectableProjects.findIndex((project) => project.id === currentProjectId) + 1;
  const rawValue = window.prompt(promptLines.join("\n"), String(Math.max(defaultIndex, 0)));
  if (rawValue === null) {
    return undefined;
  }

  const selectedIndex = Number(rawValue);
  if (!Number.isInteger(selectedIndex) || selectedIndex < 0 || selectedIndex > selectableProjects.length) {
    showTaskFeedback("Selecione um projeto valido.", "error");
    return undefined;
  }

  return selectedIndex === 0 ? PROVISIONAL_PROJECT_ID : selectableProjects[selectedIndex - 1].id;
}

function areEquivalentProjectTargets(currentProjectId, nextProjectId) {
  const normalizedCurrentProjectId = currentProjectId || PROVISIONAL_PROJECT_ID;
  const normalizedNextProjectId = nextProjectId || PROVISIONAL_PROJECT_ID;

  return normalizedCurrentProjectId === normalizedNextProjectId;
}

function getExecutionProjectTitle(currentFocus, sourceTask, sourceSubtask, projects) {
  if (!currentFocus) {
    return "Sem foco atual";
  }

  if (currentFocus.kind === "standalone") {
    return "Item avulso do plano do dia";
  }

  if (!sourceTask) {
    return "Projeto nao identificado";
  }

  return inferProjectMetadata(sourceTask, sourceSubtask, projects).title;
}

function getExecutionStatusLabel(currentFocus, sourceTask, sourceSubtask) {
  if (!currentFocus) {
    return "Sem foco";
  }

  const isCompleted = currentFocus.kind === "standalone"
    ? Boolean(currentFocus.completed)
    : Boolean(sourceSubtask?.completed ?? sourceTask?.completed);

  if (isCompleted) {
    return "Concluido";
  }

  return "Em foco";
}

function getExecutionExpectedTime(currentFocus, sourceTask, sourceSubtask, executionEntry) {
  if (!currentFocus) {
    return "Nao definido";
  }

  if (currentFocus.kind === "standalone") {
    return "Nao definido";
  }

  if (sourceSubtask?.minutes) {
    return `${sourceSubtask.minutes} min`;
  }

  const directTaskMinutes = sourceTask?.subtasks?.length === 0
    ? Number(executionEntry?.expectedMinutesOverride)
    : null;
  if (Number.isFinite(directTaskMinutes) && directTaskMinutes > 0) {
    return `${directTaskMinutes} min`;
  }

  if (sourceTask?.progress?.totalMinutes > 0) {
    return `${sourceTask.progress.totalMinutes} min estimados`;
  }

  return "Nao definido";
}

function createFallbackTimer() {
  return {
    start() {},
    pause() {},
    reset() {},
    nextPhase() {},
    setSettings() {},
    getState() {
      return "idle";
    },
    getRemainingSeconds() {
      return 0;
    },
    getSnapshot() {
      return appState.snapshot?.currentSession ?? {
        phaseId: "focus",
        phaseLabel: "Sessao de foco",
        status: "idle",
        remainingSeconds: 0,
        durationSeconds: 0,
        completedFocusCycles: 0,
        focusCyclesSinceLongBreak: 0,
        nextFocusDurationSeconds: 0
      };
    },
    applyFocusDuration() {
      return this.getSnapshot();
    },
    destroy() {}
  };
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  if (!(window.isSecureContext || isLocalhost())) {
    return;
  }

  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register("./sw.js");
      attachServiceWorkerUpdateHandlers(registration);
    } catch (error) {
      console.warn("Nao foi possivel registrar o service worker.", error);
    }
  });
}

function isLocalhost() {
  return ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
}

function attachServiceWorkerUpdateHandlers(registration) {
  if (!registration) {
    return;
  }

  if (registration.waiting) {
    pwaSupport.showUpdateReady(() => activateServiceWorkerUpdate(registration));
  } else {
    pwaSupport.clearUpdateNotice();
  }

  registration.addEventListener("updatefound", () => {
    const installingWorker = registration.installing;
    if (!installingWorker) {
      return;
    }

    installingWorker.addEventListener("statechange", () => {
      if (installingWorker.state === "installed" && navigator.serviceWorker.controller) {
        pwaSupport.showUpdateReady(() => activateServiceWorkerUpdate(registration));
      }
    });
  });

  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!isReloadingForServiceWorkerUpdate) {
      return;
    }

    window.location.reload();
  }, { once: true });
}

async function activateServiceWorkerUpdate(registration) {
  isReloadingForServiceWorkerUpdate = true;
  pwaSupport.showUpdating();

  if (registration.waiting) {
    registration.waiting.postMessage({ type: "SKIP_WAITING" });
    return;
  }

  if (typeof registration.update === "function") {
    await registration.update();
  }

  window.location.reload();
}
