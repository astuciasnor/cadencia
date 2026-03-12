import { getFocusKey } from "./focus-model.js";
import { escapeAttribute, escapeHtml } from "./utils.js";

const DAY_PLAN_UNASSIGNED_PROJECT = "__unassigned_project__";

const PRIORITY_META = {
  A: {
    label: "Alta prioridade",
    className: "priority-a"
  },
  M: {
    label: "Media prioridade",
    className: "priority-m"
  },
  B: {
    label: "Baixa prioridade",
    className: "priority-b"
  }
};

const EXECUTION_ACTION_LABELS = {
  email: "e-mail",
  "phone-call": "telefonema",
  meeting: "reuniao",
  reading: "leitura",
  writing: "escrita",
  "document-send": "envio",
  visit: "visita",
  "experimental-practice": "pratica"
};

export function renderDayPlanSection({
  dom,
  dayPlan,
  tasks,
  projects,
  currentFocus,
  executionEntries,
  selectedProjectId = ""
}) {
  if (!dom.dayPlanList || !dom.dayPlanSummary || !dom.dayPlanSourceSelect || !dom.dayPlanProjectFilter) {
    return;
  }

  const resolvedItems = resolveDayPlanItems(dayPlan, tasks, projects, currentFocus, executionEntries);
  const availableSources = buildAvailableSourceOptions(tasks, projects, dayPlan.items, selectedProjectId);
  renderDayPlanProjectFilterOptions(dom.dayPlanProjectFilter, projects, selectedProjectId);

  renderDayPlanSummary(dom.dayPlanSummary, resolvedItems);
  renderDayPlanSourceOptions(dom.dayPlanSourceSelect, availableSources);
  renderDayPlanTableList(dom.dayPlanList, resolvedItems);
}

function renderDayPlanSummary(dayPlanSummaryElement, items) {
  const standaloneCount = items.filter((item) => item.kind === "standalone").length;
  const linkedCount = items.length - standaloneCount;

  dayPlanSummaryElement.textContent = `${items.length} itens - ${standaloneCount} avulsos operacionais - ${linkedCount} selecoes de projeto`;
}

function renderDayPlanSourceOptions(dayPlanSourceSelect, sources) {
  if (sources.length === 0) {
    dayPlanSourceSelect.innerHTML = `
      <option value="">Nenhuma tarefa ou subtarefa disponivel</option>
    `;
    dayPlanSourceSelect.disabled = true;
    return;
  }

  dayPlanSourceSelect.disabled = false;
  dayPlanSourceSelect.innerHTML = `
    <option value="">Escolha uma tarefa ou subtarefa</option>
    ${sources.map((source) => `
      <option value="${escapeAttribute(source.value)}">${escapeHtml(source.label)}</option>
    `).join("")}
  `;
}

function renderDayPlanProjectFilterOptions(dayPlanProjectFilter, projects, selectedProjectId) {
  const normalizedValue = projects.some((project) => project.id === selectedProjectId) ||
    selectedProjectId === DAY_PLAN_UNASSIGNED_PROJECT
    ? selectedProjectId
    : "";

  dayPlanProjectFilter.innerHTML = `
    <option value="">Todos os projetos</option>
    <option value="${DAY_PLAN_UNASSIGNED_PROJECT}">Sem projeto</option>
    ${projects.map((project) => `
      <option value="${escapeAttribute(project.id)}">${escapeHtml(project.title)}</option>
    `).join("")}
  `;

  dayPlanProjectFilter.value = normalizedValue;
}

function renderDayPlanTableList(dayPlanListElement, items) {
  if (items.length === 0) {
    dayPlanListElement.innerHTML = `
      <li class="empty-state">
        <strong>Nenhum item selecionado para hoje.</strong>
        <p>Adicione uma pendencia simples do dia ou selecione aqui uma tarefa ou subtarefa de projeto para entrar hoje.</p>
      </li>
    `;
    return;
  }

  dayPlanListElement.innerHTML = `
    <li class="day-plan-table-head" aria-hidden="true">
      <span>Nome - Tarefa/Subtarefa</span>
      <span>Projeto</span>
      <span>Prioridade</span>
      <span>Forma de execucao</span>
      <span class="day-plan-table-actions-head">Foco</span>
    </li>
    ${items.map((item) => renderDayPlanTableRow(item)).join("")}
  `;
}

function renderDayPlanManageItem(item) {
  const priorityMeta = PRIORITY_META[item.priority];
  const focusLabel = item.isCurrentFocus ? "Foco atual" : "Definir foco";
  const focusDisabled = item.kind !== "standalone" && !item.sourceAvailable;

  return `
    <li class="day-plan-manage-item${item.isCurrentFocus ? " is-selected" : ""}${item.completed ? " is-complete" : ""}" data-day-plan-id="${escapeAttribute(item.id)}">
      <label class="day-plan-check" aria-label="Concluir item do plano do dia">
        <input class="day-plan-toggle" data-day-plan-id="${escapeAttribute(item.id)}" type="checkbox" ${item.completed ? "checked" : ""}>
      </label>

      <div class="day-plan-manage-copy">
        <div class="day-plan-item-title-row">
          <span class="badge">${escapeHtml(item.typeLabel)}</span>
          <span class="day-plan-priority ${priorityMeta.className}">${item.priority}</span>
          ${item.isCurrentFocus ? '<span class="focus-pill">Em foco</span>' : ""}
        </div>
        <strong class="day-plan-item-title">${escapeHtml(item.title)}</strong>
        <p class="day-plan-item-meta">${escapeHtml(item.projectTitle)} Â· ${escapeHtml(item.meta)}</p>
      </div>

      <div class="day-plan-manage-actions">
        <label class="field day-plan-priority-field">
          <span>Prioridade</span>
          <select class="day-plan-priority-select" data-day-plan-id="${escapeAttribute(item.id)}" aria-label="Prioridade do item">
            ${Object.entries(PRIORITY_META).map(([value, meta]) => `
              <option value="${value}" ${item.priority === value ? "selected" : ""}>${meta.label}</option>
            `).join("")}
          </select>
        </label>
        <button class="action-button" type="button" data-day-plan-action="focus-item" data-day-plan-id="${escapeAttribute(item.id)}" ${focusDisabled ? "disabled" : ""} data-variant="ghost">${focusLabel}</button>
        <button class="action-button danger-action" type="button" data-day-plan-action="remove-item" data-day-plan-id="${escapeAttribute(item.id)}" data-variant="ghost">Excluir</button>
      </div>
    </li>
  `;
}

function renderDayPlanTableRow(item) {
  const priorityMeta = PRIORITY_META[item.priority];
  const focusLabel = item.isCurrentFocus ? "Em foco" : "Definir foco";
  const focusDisabled = item.kind !== "standalone" && !item.sourceAvailable;

  return `
    <li class="day-plan-print-row${item.completed ? " is-complete" : ""}">
      <div class="day-plan-print-cell day-plan-print-name">
        <label class="day-plan-check day-plan-table-check" aria-label="Concluir item da tabela do dia">
          <input class="day-plan-toggle" data-day-plan-id="${escapeAttribute(item.id)}" type="checkbox" ${item.completed ? "checked" : ""}>
        </label>
        <div class="day-plan-print-copy">
          <strong class="day-plan-print-title">${escapeHtml(item.title)}</strong>
          <span class="day-plan-print-meta">${escapeHtml(item.typeLabel)}${item.isCurrentFocus ? " - Em foco" : ""}</span>
        </div>
      </div>
      <div class="day-plan-print-cell">
        <span class="day-plan-print-project">${escapeHtml(item.projectTitle)}</span>
      </div>
      <div class="day-plan-print-cell">
        <span class="day-plan-priority ${priorityMeta.className}">${item.priority}</span>
      </div>
      <div class="day-plan-print-cell">
        <span class="day-plan-print-execution">${escapeHtml(item.executionSummary)}</span>
      </div>
      <div class="day-plan-print-cell day-plan-print-actions">
        <button class="action-button day-plan-focus-button" type="button" data-day-plan-action="focus-item" data-day-plan-id="${escapeAttribute(item.id)}" ${focusDisabled ? "disabled" : ""} data-variant="ghost">${focusLabel}</button>
      </div>
    </li>
  `;
}

function resolveDayPlanItems(dayPlan, tasks, projects, currentFocus, executionEntries = {}) {
  return dayPlan.items
    .map((item, index) => resolveDayPlanItem(item, index, tasks, projects, currentFocus, executionEntries))
    .sort(compareDayPlanItems);
}

function resolveDayPlanItem(item, index, tasks, projects, currentFocus, executionEntries) {
  const sourceTask = item.sourceTaskId
    ? tasks.find((task) => task.id === item.sourceTaskId)
    : null;
  const sourceSubtask = sourceTask && item.sourceSubtaskId
    ? sourceTask.subtasks.find((subtask) => subtask.id === item.sourceSubtaskId)
    : null;
  const sourceAvailable = item.kind === "standalone"
    ? true
    : item.kind === "task"
      ? Boolean(sourceTask)
      : Boolean(sourceTask && sourceSubtask);
  const liveTitle = item.kind === "task"
    ? sourceTask?.title
    : item.kind === "subtask"
      ? sourceSubtask?.title
      : null;
  const liveCompleted = item.kind === "task"
    ? sourceTask?.completed
    : item.kind === "subtask"
      ? sourceSubtask?.completed
      : item.completed;
  const isCurrentFocus = item.kind === "standalone"
    ? currentFocus?.kind === "standalone" && currentFocus.dayPlanItemId === item.id
    : currentFocus?.kind === item.kind &&
      currentFocus.sourceTaskId === item.sourceTaskId &&
      currentFocus.sourceSubtaskId === item.sourceSubtaskId;
  const executionEntry = resolveExecutionEntry(item, executionEntries);

  return {
    ...item,
    title: liveTitle || item.title,
    completed: Boolean(liveCompleted),
    sourceAvailable,
    isCurrentFocus,
    projectMissing: item.kind !== "standalone" && !sourceAvailable,
    typeLabel: getItemTypeLabel(item.kind),
    projectTitle: getItemProjectTitle(item, sourceTask, projects, sourceAvailable),
    executionSummary: buildExecutionSummary(executionEntry),
    executionHint: buildExecutionHint(item, executionEntry),
    meta: buildDayPlanMeta(item, sourceTask, sourceSubtask, sourceAvailable),
    sortIndex: index
  };
}

function resolveExecutionEntry(item, executionEntries) {
  const focusCandidate = item.kind === "standalone"
    ? {
      kind: "standalone",
      dayPlanItemId: item.id
    }
    : item.kind === "subtask"
      ? {
        kind: "subtask",
        sourceTaskId: item.sourceTaskId,
        sourceSubtaskId: item.sourceSubtaskId
      }
      : {
        kind: "task",
        sourceTaskId: item.sourceTaskId
      };
  const executionKey = getFocusKey(focusCandidate);
  return executionKey ? executionEntries[executionKey] ?? null : null;
}

function buildExecutionSummary(entry) {
  if (!entry) {
    return "Nao definido";
  }

  const actionCount = Array.isArray(entry.actions) ? entry.actions.length : 0;
  const modeLabel = entry.mode === "meeting" ? "Com outras pessoas" : "Sozinho";
  if (actionCount > 0) {
    return `${modeLabel} - ${actionCount} acoes`;
  }

  if (entry.materials) {
    return `${modeLabel} - materiais definidos`;
  }

  return `${modeLabel} - sem detalhes`;
}

function buildExecutionHint(item, entry) {
  if (!entry) {
    return item.kind === "standalone"
      ? "Forma de execucao ainda nao preenchida."
      : "Preencha na aba Ritmo se precisar detalhar a forma de execucao.";
  }

  const parts = [];
  if (entry.actions?.length) {
    parts.push(formatExecutionActions(entry.actions));
  }
  if (entry.materials) {
    parts.push("materiais definidos");
  }

  return parts.length > 0 ? parts.join(" Â· ") : "Execucao registrada de forma leve.";
}

function formatExecutionActions(actions) {
  const labels = actions.slice(0, 2).map((action) => EXECUTION_ACTION_LABELS[action] || action);
  return labels.join(", ");
}

function getItemTypeLabel(kind) {
  switch (kind) {
    case "task":
      return "Tarefa";
    case "subtask":
      return "Subtarefa";
    default:
      return "Avulsa";
  }
}

function getItemProjectTitle(item, sourceTask, projects, sourceAvailable) {
  if (item.kind === "standalone") {
    return "Sem projeto";
  }

  if (!sourceAvailable) {
    return "Origem ausente";
  }

  return getProjectTitle(sourceTask?.projectId, projects);
}

function buildDayPlanMeta(item, sourceTask, sourceSubtask, sourceAvailable) {
  if (item.kind === "standalone") {
    return "Item operacional avulso planejado para hoje.";
  }

  if (!sourceAvailable) {
    return "Origem do projeto nao encontrada. Voce pode manter o item ou remove-lo do plano.";
  }

  if (item.kind === "task") {
    return sourceTask.subtasks.length > 0
      ? `${sourceTask.subtasks.filter((subtask) => subtask.completed).length} de ${sourceTask.subtasks.length} subtarefas concluidas`
      : "Tarefa de projeto selecionada para hoje.";
  }

  return `${sourceTask.title} - ${sourceSubtask.minutes} min de referencia`;
}

function buildAvailableSourceOptions(tasks, projects, dayPlanItems, selectedProjectId = "") {
  const linkedKeys = new Set(
    dayPlanItems
      .filter((item) => item.kind !== "standalone")
      .map((item) => `${item.sourceTaskId || ""}:${item.sourceSubtaskId || ""}`)
  );
  const options = [];

  tasks.forEach((task) => {
    if (!matchesProjectFilter(task.projectId, selectedProjectId)) {
      return;
    }

    const taskKey = `${task.id}:`;
    const projectTitle = getProjectTitle(task.projectId, projects);
    if (!linkedKeys.has(taskKey)) {
      options.push({
        value: `task:${task.id}`,
        label: `Tarefa - ${projectTitle} / ${task.title}`
      });
    }

    task.subtasks.forEach((subtask) => {
      const subtaskKey = `${task.id}:${subtask.id}`;
      if (linkedKeys.has(subtaskKey)) {
        return;
      }

      options.push({
        value: `subtask:${task.id}:${subtask.id}`,
        label: `Subtarefa - ${projectTitle} / ${task.title} / ${subtask.title}`
      });
    });
  });

  return options;
}

function matchesProjectFilter(projectId, selectedProjectId) {
  if (!selectedProjectId) {
    return true;
  }

  if (selectedProjectId === DAY_PLAN_UNASSIGNED_PROJECT) {
    return !projectId;
  }

  return projectId === selectedProjectId;
}

function getProjectTitle(projectId, projects) {
  if (!projectId) {
    return "Sem projeto";
  }

  return projects.find((project) => project.id === projectId)?.title || "Sem projeto";
}

function compareDayPlanItems(left, right) {
  const priorityScore = getPriorityScore(right.priority) - getPriorityScore(left.priority);
  if (priorityScore !== 0) {
    return priorityScore;
  }

  if (left.completed !== right.completed) {
    return left.completed ? 1 : -1;
  }

  return left.sortIndex - right.sortIndex;
}

function getPriorityScore(priority) {
  switch (priority) {
    case "A":
      return 3;
    case "M":
      return 2;
    default:
      return 1;
  }
}
