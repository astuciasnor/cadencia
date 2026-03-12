import {
  PROVISIONAL_PROJECT_COLOR,
  PROVISIONAL_PROJECT_ID,
  PROVISIONAL_PROJECT_TITLE
} from "./task-model.js";
import { getFocusKey } from "./focus-model.js";
import { formatDuration, getTodayKey } from "./utils.js";

export const UNASSIGNED_PROJECT = {
  id: PROVISIONAL_PROJECT_ID,
  title: PROVISIONAL_PROJECT_TITLE,
  description: "Tarefa ainda nao vinculada a um projeto real.",
  color: PROVISIONAL_PROJECT_COLOR
};

export function findTaskById(tasks, taskId) {
  if (!taskId) {
    return null;
  }

  return tasks.find((task) => task.id === taskId) ?? null;
}

export function findTaskSelection(tasks, taskId, subtaskId) {
  const task = findTaskById(tasks, taskId);
  if (!task || !subtaskId) {
    return null;
  }

  const subtask = task.subtasks.find((item) => item.id === subtaskId);
  if (!subtask) {
    return null;
  }

  return { task, subtask };
}

export function getTodayHistoryFromSnapshot(snapshot) {
  const todayKey = getTodayKey();

  return snapshot.history.days[todayKey] ?? {
    date: todayKey,
    completedFocusSessions: 0,
    completedMicroPauses: 0,
    completedLongBreaks: 0,
    focusedMinutes: 0,
    totalTasks: 0,
    completedTasks: 0,
    updatedAt: null
  };
}

export function getTimerStatusText(status, snapshot) {
  switch (status) {
    case "running":
      return `${snapshot.phaseLabel} em andamento`;
    case "paused":
      return `${snapshot.phaseLabel} pausada`;
    default:
      return "Tudo pronto para comecar";
  }
}

export function getFocusedItemMinutes({ currentFocus, tasks, executionEntries }) {
  if (!currentFocus || currentFocus.kind === "standalone") {
    return 0;
  }

  if (Number.isFinite(Number(currentFocus.minutes)) && Number(currentFocus.minutes) > 0) {
    return Number(currentFocus.minutes);
  }

  if (currentFocus.kind !== "task") {
    return 0;
  }

  const task = findTaskById(tasks, currentFocus.sourceTaskId || currentFocus.taskId);
  if (!task || task.subtasks.length > 0) {
    return 0;
  }

  const executionKey = getFocusKey(currentFocus);
  const expectedMinutesOverride = executionKey
    ? getPositiveNumber(executionEntries?.[executionKey]?.expectedMinutesOverride)
    : null;

  return expectedMinutesOverride ?? 0;
}

export function getReservedFocusMinutes(session) {
  return session?.phaseId !== "focus" && session?.nextFocusDurationSeconds > 0
    ? Math.round(session.nextFocusDurationSeconds / 60)
    : 0;
}

export function getFocusTimeHelperText(minutes, session, appliedToCurrentFocus, appliedToNextFocus) {
  if (appliedToCurrentFocus) {
    return `O foco atual sugere ${minutes} min e esse tempo ja esta aplicado na sessao de foco atual.`;
  }

  if (appliedToNextFocus) {
    return `O foco atual sugere ${minutes} min e esse tempo ja esta reservado para o proximo bloco de foco.`;
  }

  if (session.phaseId === "focus" && session.status === "idle") {
    return `O foco atual sugere ${minutes} min. Voce pode aplicar esse tempo diretamente a esta sessao antes de comecar.`;
  }

  return `O foco atual sugere ${minutes} min. Voce pode reservar esse tempo para o proximo bloco de foco sem alterar a configuracao global.`;
}

export function getApplyFocusMinutesSuccessMessage(snapshot, minutes) {
  return snapshot.phaseId === "focus" && snapshot.status === "idle"
    ? `${minutes} min aplicados a esta sessao de foco.`
    : `${minutes} min reservados para o proximo bloco de foco.`;
}

export function getPhaseHint(phaseId) {
  switch (phaseId) {
    case "micro":
      return "Levante, respire e volte antes de perder o ritmo.";
    case "long":
      return "Aproveite a pausa longa para recuperar energia sem dispersar demais.";
    default:
      return "Escolha um foco e comece pelo proximo passo viavel.";
  }
}

export function getContextTip(phaseId, focus) {
  if (phaseId === "focus" && focus?.description) {
    return `Foco atual: ${focus.description}`;
  }

  if (phaseId === "micro") {
    return "Micro pausas funcionam melhor quando voce realmente sai da tela por alguns minutos.";
  }

  if (phaseId === "long") {
    return "Na pausa longa, vale beber agua, alongar e revisar se a proxima tarefa ainda faz sentido.";
  }

  return "Dica rapida: se a tarefa parecer grande demais, transforme em uma subtarefa de 10 a 20 minutos.";
}

export function findProjectById(projects, projectId) {
  if (!projectId) {
    return null;
  }

  return projects.find((project) => project.id === projectId) ?? null;
}

export function inferProjectId(task) {
  return task?.projectId ?? null;
}

export function inferProjectMetadata(task, subtask = null, projects = []) {
  const resolvedProject = findProjectById(projects, inferProjectId(task));
  return resolvedProject ?? UNASSIGNED_PROJECT;
}

export function buildTaskRhythmView({ currentFocus, tasks, projects, session, settings, executionEntry }) {
  if (!currentFocus) {
    return null;
  }

  if (currentFocus.kind === "standalone") {
    return buildStandaloneRhythmView(currentFocus, session, settings);
  }

  const sourceTaskId = currentFocus.sourceTaskId || currentFocus.taskId;
  const task = findTaskById(tasks, sourceTaskId);
  if (!task) {
    return buildUnavailableRhythmView(currentFocus, session, settings);
  }

  if (currentFocus.kind === "subtask") {
    const selection = findTaskSelection(tasks, sourceTaskId, currentFocus.sourceSubtaskId || currentFocus.subtaskId);
    if (!selection) {
      return buildUnavailableRhythmView(currentFocus, session, settings);
    }

    return buildSubtaskRhythmView(selection.task, selection.subtask, session, projects, settings);
  }

  return buildTaskRhythmViewFromTask(task, executionEntry, session, projects, settings);
}

export function buildDayProgressView({ currentFocus, settings, tasks, todayHistory }) {
  const safeTodayHistory = todayHistory ?? {
    completedFocusSessions: 0,
    focusedMinutes: 0
  };
  const todayKey = getTodayKey();
  const completedTasksToday = countCompletedTasksToday(tasks, todayKey);
  const completedSubtasksToday = countCompletedSubtasksToday(tasks, todayKey);
  const totalTrackableUnits = getTotalTrackableUnits(tasks);
  const completedUnitsToday = completedTasksToday + completedSubtasksToday;
  const focusProgressRatio = settings?.dailyTarget > 0
    ? Math.min(1, safeTodayHistory.completedFocusSessions / settings.dailyTarget)
    : 0;
  const completionProgressRatio = totalTrackableUnits > 0
    ? Math.min(1, completedUnitsToday / totalTrackableUnits)
    : focusProgressRatio;
  const overallProgressPercentage = Math.round(((focusProgressRatio + completionProgressRatio) / 2) * 100);

  return {
    sessionsToday: safeTodayHistory.completedFocusSessions,
    focusedMinutesToday: safeTodayHistory.focusedMinutes,
    completedTasksToday,
    completedSubtasksToday,
    currentFocusLabel: currentFocus?.label || "Nenhum foco definido",
    currentFocusMeta: getDayProgressFocusMeta(currentFocus),
    overallProgressPercentage,
    overallProgressLabel: getDayProgressLabel(overallProgressPercentage),
    supportText: getDayProgressSupportText({
      overallProgressPercentage,
      todayHistory: safeTodayHistory,
      completedTasksToday,
      completedSubtasksToday,
      settings
    })
  };
}

function buildStandaloneRhythmView(currentFocus, session, settings) {
  const stageKey = getRhythmStageKey(Boolean(currentFocus.completed), session);
  const timingProfile = buildRhythmTimingProfile(null, settings);

  return {
    kind: "standalone",
    taskId: null,
    subtaskId: null,
    title: currentFocus.label || currentFocus.taskTitle,
    parentTitle: "Plano do dia",
    projectTitle: "Sem projeto vinculado",
    projectDescription: "Item avulso do plano do dia.",
    status: getRhythmStatusLabel(Boolean(currentFocus.completed), session),
    expectedTime: "Nao definido",
    isFocused: "Sim",
    progressPercentage: currentFocus.completed ? 100 : 0,
    progressText: currentFocus.completed ? "Item concluido" : "Item ainda nao concluido",
    progressHint: "Se o item ficar grande demais, vale quebrar em uma tarefa concreta.",
    nextStep: getStandaloneNextStep(Boolean(currentFocus.completed), session),
    stageLabel: getRhythmStageLabel(stageKey),
    stages: buildRhythmStages(stageKey),
    supportLabel: session.phaseLabel,
    timerHint: getRhythmTimerHint(session),
    workBlock: timingProfile.workBlock,
    shortBreak: timingProfile.shortBreak,
    longBreak: timingProfile.longBreak,
    cyclesEstimate: timingProfile.cyclesEstimate,
    projectAccent: "general",
    editableMinutes: null,
    nextStepNote: "",
    cognitiveProfile: {
      startEase: null,
      anxietyLevel: null,
      perceivedLoad: null
    }
  };
}

function countCompletedTasksToday(tasks, todayKey) {
  return tasks.filter((task) => isCompletedToday(task.completedAt, todayKey)).length;
}

function countCompletedSubtasksToday(tasks, todayKey) {
  return tasks.reduce(
    (sum, task) => sum + task.subtasks.filter((subtask) => isCompletedToday(subtask.completedAt, todayKey)).length,
    0
  );
}

function getTotalTrackableUnits(tasks) {
  return tasks.reduce((sum, task) => sum + 1 + task.subtasks.length, 0);
}

function isCompletedToday(completedAt, todayKey) {
  return typeof completedAt === "string" && completedAt.startsWith(todayKey);
}

function getDayProgressFocusMeta(currentFocus) {
  if (!currentFocus) {
    return "Defina um foco nas abas Timer, Projetos ou Plano do dia para dar contexto ao restante do dia.";
  }

  if (currentFocus.kind === "standalone") {
    return "Item avulso do plano do dia em destaque.";
  }

  if (currentFocus.subtaskTitle) {
    return `${currentFocus.taskTitle} - ${currentFocus.subtaskTitle}`;
  }

  return currentFocus.taskTitle || "Tarefa em foco";
}

function getDayProgressLabel(overallProgressPercentage) {
  if (overallProgressPercentage >= 80) {
    return "Dia bem encaminhado";
  }

  if (overallProgressPercentage >= 50) {
    return "Bom ritmo de avanço";
  }

  if (overallProgressPercentage >= 20) {
    return "Ritmo inicial do dia";
  }

  return "Dia ainda abrindo tracao";
}

function getDayProgressSupportText({
  overallProgressPercentage,
  todayHistory,
  completedTasksToday,
  completedSubtasksToday,
  settings
}) {
  if (overallProgressPercentage >= 80) {
    return "O dia ja mostra avanço consistente entre foco e entregas. Vale proteger as ultimas janelas de trabalho importante.";
  }

  if (todayHistory.completedFocusSessions === 0) {
    return "Ainda nao houve sessao concluida hoje. Comece por um bloco curto e uma tarefa concreta para ganhar tracao.";
  }

  if (completedTasksToday + completedSubtasksToday === 0) {
    return "Ja houve foco hoje, mas ainda sem fechamentos concretos. Tente concluir um passo menor e observavel.";
  }

  if (todayHistory.completedFocusSessions < settings.dailyTarget) {
    return "O dia esta avançando. Se fizer sentido, preserve energia para as prioridades de ensino, pesquisa ou escrita mais relevantes.";
  }

  return "O painel mostra consistencia de foco e execucao. Use isso para decidir o que ainda vale concluir hoje.";
}

function buildTaskRhythmViewFromTask(task, executionEntry, session, projects, settings) {
  const project = inferProjectMetadata(task, null, projects);
  const stageKey = getRhythmStageKey(task.completed, session);
  const directTaskMinutes = task.subtasks.length === 0
    ? getPositiveNumber(executionEntry?.expectedMinutesOverride)
    : null;
  const estimatedMinutes = task.progress.totalMinutes > 0
    ? task.progress.totalMinutes
    : directTaskMinutes;
  const expectedTime = task.progress.totalMinutes > 0
    ? `${task.progress.totalMinutes} min estimados`
    : directTaskMinutes
      ? `${directTaskMinutes} min`
    : "Nao definido";
  const progressHint = task.progress.totalMinutes > 0
    ? `${task.progress.completedMinutes}/${task.progress.totalMinutes} min estimados concluidos`
    : directTaskMinutes
      ? "Tempo previsto definido diretamente nesta tarefa."
      : task.subtasks.length === 0
        ? "Defina um tempo previsto para usar esta tarefa como unidade executavel."
        : "Defina tempos nas subtarefas para enxergar melhor o ritmo real.";
  const nextStep = task.completed
    ? "Escolha o proximo item prioritario do dia para manter a continuidade."
    : task.subtasks.length > 0
      ? "Escolha a proxima subtarefa concreta para reduzir ambiguidade antes do proximo bloco."
      : "Use esta tarefa como unidade executavel enquanto ela continuar pequena e concreta.";
  const timingProfile = buildRhythmTimingProfile(estimatedMinutes, settings);

  return {
    kind: "task",
    taskId: task.id,
    subtaskId: null,
    title: task.title,
    parentTitle: "Tarefa principal",
    projectTitle: project.title,
    projectDescription: project.description,
    status: getRhythmStatusLabel(task.completed, session),
    expectedTime,
    isFocused: task.isFocus ? "Sim" : "Nao",
    progressPercentage: task.progress.percentage,
    progressText: `${task.progress.unitCompleted}/${task.progress.unitTotal} etapas concluidas`,
    progressHint,
    nextStep: task.nextStepNote || nextStep,
    stageLabel: getRhythmStageLabel(stageKey),
    stages: buildRhythmStages(stageKey),
    supportLabel: session.phaseLabel,
    timerHint: getRhythmTimerHint(session),
    workBlock: timingProfile.workBlock,
    shortBreak: timingProfile.shortBreak,
    longBreak: timingProfile.longBreak,
    cyclesEstimate: timingProfile.cyclesEstimate,
    projectAccent: "general",
    editableMinutes: null,
    nextStepNote: task.nextStepNote || "",
    cognitiveProfile: task.cognitiveProfile
  };
}

function buildSubtaskRhythmView(task, subtask, session, projects, settings) {
  const project = inferProjectMetadata(task, subtask, projects);
  const stageKey = getRhythmStageKey(subtask.completed, session);
  const defaultNextStep = subtask.completed
    ? "Revise a tarefa principal e escolha o proximo passo relevante."
    : "Execute apenas a menor acao observavel que faca esta subtarefa avancar.";
  const timingProfile = buildRhythmTimingProfile(subtask.minutes, settings);

  return {
    kind: "subtask",
    taskId: task.id,
    subtaskId: subtask.id,
    title: subtask.title,
    parentTitle: task.title,
    projectTitle: project.title,
    projectDescription: project.description,
    status: getRhythmStatusLabel(subtask.completed, session),
    expectedTime: `${subtask.minutes} min`,
    isFocused: subtask.isFocus ? "Sim" : "Nao",
    progressPercentage: subtask.completed ? 100 : 0,
    progressText: subtask.completed ? "Subtarefa concluida" : "Subtarefa em andamento",
    progressHint: `${task.progress.unitCompleted}/${task.progress.unitTotal} etapas da tarefa principal concluidas`,
    nextStep: subtask.nextStepNote || defaultNextStep,
    stageLabel: getRhythmStageLabel(stageKey),
    stages: buildRhythmStages(stageKey),
    supportLabel: session.phaseLabel,
    timerHint: getRhythmTimerHint(session),
    workBlock: timingProfile.workBlock,
    shortBreak: timingProfile.shortBreak,
    longBreak: timingProfile.longBreak,
    cyclesEstimate: timingProfile.cyclesEstimate,
    projectAccent: "general",
    editableMinutes: subtask.minutes,
    nextStepNote: subtask.nextStepNote || "",
    cognitiveProfile: subtask.cognitiveProfile
  };
}

function buildUnavailableRhythmView(currentFocus, session, settings) {
  const stageKey = getRhythmStageKey(false, session);
  const timingProfile = buildRhythmTimingProfile(null, settings);

  return {
    kind: currentFocus.kind || "task",
    taskId: currentFocus.taskId || null,
    subtaskId: currentFocus.subtaskId || null,
    title: currentFocus.label || "Item em foco",
    parentTitle: "Origem nao encontrada",
    projectTitle: "Contexto indisponivel",
    projectDescription: "O item selecionado nao esta mais disponivel na base atual.",
    status: getRhythmStatusLabel(false, session),
    expectedTime: "Nao definido",
    isFocused: "Sim",
    progressPercentage: 0,
    progressText: "Sem dados de progresso",
    progressHint: "Atualize o foco escolhendo novamente a tarefa ou subtarefa correta.",
    nextStep: "Revise a selecao atual e escolha novamente o item mais relevante.",
    stageLabel: getRhythmStageLabel(stageKey),
    stages: buildRhythmStages(stageKey),
    supportLabel: session.phaseLabel,
    timerHint: getRhythmTimerHint(session),
    workBlock: timingProfile.workBlock,
    shortBreak: timingProfile.shortBreak,
    longBreak: timingProfile.longBreak,
    cyclesEstimate: timingProfile.cyclesEstimate,
    projectAccent: "general",
    editableMinutes: null,
    nextStepNote: "",
    cognitiveProfile: {
      startEase: null,
      anxietyLevel: null,
      perceivedLoad: null
    }
  };
}

function getRhythmStatusLabel(completed, session) {
  if (completed) {
    return "Concluido";
  }

  if (session.phaseId === "focus" && session.status === "running") {
    return "Em foco";
  }

  if (session.status === "paused") {
    return "Pausado";
  }

  if (session.phaseId === "micro") {
    return "Em micro pausa";
  }

  if (session.phaseId === "long") {
    return "Em pausa longa";
  }

  return "Pronto para iniciar";
}

function getRhythmStageKey(completed, session) {
  if (completed) {
    return "done";
  }

  if (session.phaseId !== "focus") {
    return "pause";
  }

  if (session.status === "running") {
    return "execute";
  }

  return "prepare";
}

function getRhythmStageLabel(stageKey) {
  switch (stageKey) {
    case "execute":
      return "Bloco de foco em andamento";
    case "pause":
      return "Momento de pausa e ajuste";
    case "done":
      return "Item concluido";
    default:
      return "Preparacao para o proximo bloco";
  }
}

function buildRhythmStages(currentStageKey) {
  const stageIndex = {
    prepare: 1,
    execute: 2,
    pause: 3,
    done: 4
  }[currentStageKey] || 1;

  return [
    { label: "Selecionado", state: "complete" },
    { label: "Preparar", state: resolveStageState(1, stageIndex) },
    { label: "Executar", state: resolveStageState(2, stageIndex) },
    { label: "Pausa e ajuste", state: resolveStageState(3, stageIndex) },
    { label: "Concluir", state: resolveStageState(4, stageIndex) }
  ];
}

function resolveStageState(stepIndex, currentIndex) {
  if (stepIndex < currentIndex) {
    return "complete";
  }

  if (stepIndex === currentIndex) {
    return "current";
  }

  return "upcoming";
}

function getRhythmTimerHint(session) {
  if (session.phaseId === "focus") {
    return `Sessao prevista: ${formatDuration(session.durationSeconds)}.`;
  }

  return `Fase atual: ${session.phaseLabel.toLowerCase()}.`;
}

function getStandaloneNextStep(completed, session) {
  if (completed) {
    return "Escolha o proximo item relevante do plano do dia para manter o ritmo.";
  }

  if (session.phaseId === "focus" && session.status === "running") {
    return "Mantenha uma unica frente aberta ate o fim deste bloco de foco.";
  }

  if (session.phaseId !== "focus") {
    return "Use a pausa para revisar rapidamente o proximo passo concreto antes de retomar.";
  }

  return "Defina a primeira acao observavel e inicie um bloco curto de foco para ganhar tracao.";
}

function buildRhythmTimingProfile(estimatedMinutes, settings) {
  const focusMinutes = getPositiveNumber(settings?.focusMinutes);
  const shortBreakMinutes = getPositiveNumber(settings?.microBreakMinutes);
  const longBreakMinutes = getPositiveNumber(settings?.longBreakMinutes);

  return {
    workBlock: focusMinutes ? `${focusMinutes} min` : "Nao definido",
    shortBreak: shortBreakMinutes ? `${shortBreakMinutes} min` : "Nao definido",
    longBreak: longBreakMinutes ? `${longBreakMinutes} min` : "Nao definido",
    cyclesEstimate: focusMinutes && estimatedMinutes
      ? formatCycleCount(Math.max(1, Math.ceil(estimatedMinutes / focusMinutes)))
      : "Nao definido"
  };
}

function getPositiveNumber(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) && numericValue > 0 ? numericValue : null;
}

function formatCycleCount(count) {
  return count === 1 ? "1 ciclo" : `${count} ciclos`;
}
