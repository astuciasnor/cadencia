import { escapeAttribute, escapeHtml } from "./utils.js";

export function renderTaskSection({
  dom,
  taskSummary,
  currentFocus,
  tasks,
  projects,
  session,
  focusedItemMinutes,
  reservedFocusMinutes,
  getFocusTimeHelperText
}) {
  renderTaskSummary(dom.taskSummary, taskSummary);
  renderFocusCard(dom.taskFocusLabel, dom.taskFocusCaption, currentFocus);
  renderFocusTimeHelper({
    focusTimeHelper: dom.focusTimeHelper,
    focusTimeHelperText: dom.focusTimeHelperText,
    applyFocusMinutesButton: dom.applyFocusMinutesButton,
    session,
    focusedItemMinutes,
    reservedFocusMinutes,
    getFocusTimeHelperText
  });
  renderTaskList(dom.taskList, tasks, projects);
}

export function renderTaskFocusTimeHelper({
  dom,
  session,
  focusedItemMinutes,
  reservedFocusMinutes,
  getFocusTimeHelperText
}) {
  renderFocusTimeHelper({
    focusTimeHelper: dom.focusTimeHelper,
    focusTimeHelperText: dom.focusTimeHelperText,
    applyFocusMinutesButton: dom.applyFocusMinutesButton,
    session,
    focusedItemMinutes,
    reservedFocusMinutes,
    getFocusTimeHelperText
  });
}

function renderTaskSummary(taskSummaryElement, taskSummary) {
  if (!taskSummaryElement || !taskSummary) {
    return;
  }

  taskSummaryElement.textContent = `${taskSummary.completed} de ${taskSummary.total} concluidas`;
}

function renderFocusCard(taskFocusLabel, taskFocusCaption, focus) {
  const focusCard = taskFocusLabel?.closest(".focus-card") ?? null;

  if (!focus) {
    if (focusCard) {
      focusCard.dataset.hasFocus = "false";
    }

    if (taskFocusLabel) {
      taskFocusLabel.textContent = "Nenhum foco definido";
    }

    if (taskFocusCaption) {
      taskFocusCaption.textContent = "Escolha uma tarefa ou subtarefa para guiar a proxima sessao de foco.";
    }

    return;
  }

  if (focusCard) {
    focusCard.dataset.hasFocus = "true";
  }

  if (taskFocusLabel) {
    taskFocusLabel.textContent = focus.label;
  }

  if (taskFocusCaption) {
    taskFocusCaption.textContent = focus.description;
  }
}

function renderFocusTimeHelper({
  focusTimeHelper,
  focusTimeHelperText,
  applyFocusMinutesButton,
  session,
  focusedItemMinutes,
  reservedFocusMinutes,
  getFocusTimeHelperText
}) {
  if (!focusTimeHelper || !focusTimeHelperText || !applyFocusMinutesButton) {
    return;
  }

  if (!focusedItemMinutes) {
    renderReservedFocusHelper(
      focusTimeHelper,
      focusTimeHelperText,
      applyFocusMinutesButton,
      reservedFocusMinutes
    );
    return;
  }

  const isIdleFocusSession = session.phaseId === "focus" && session.status === "idle";
  const appliedToCurrentFocus = isIdleFocusSession && session.durationSeconds === focusedItemMinutes * 60;
  const appliedToNextFocus =
    session.phaseId !== "focus" &&
    session.nextFocusDurationSeconds === focusedItemMinutes * 60;

  focusTimeHelper.hidden = false;
  applyFocusMinutesButton.hidden = false;
  focusTimeHelperText.textContent = getFocusTimeHelperText(
    focusedItemMinutes,
    session,
    appliedToCurrentFocus,
    appliedToNextFocus
  );
  applyFocusMinutesButton.textContent = isIdleFocusSession
    ? `Usar ${focusedItemMinutes} min nesta sessao`
    : `Usar ${focusedItemMinutes} min no proximo foco`;
  applyFocusMinutesButton.disabled = appliedToCurrentFocus || appliedToNextFocus;
}

function renderReservedFocusHelper(
  focusTimeHelper,
  focusTimeHelperText,
  applyFocusMinutesButton,
  reservedFocusMinutes
) {
  if (reservedFocusMinutes > 0) {
    focusTimeHelper.hidden = false;
    focusTimeHelperText.textContent = `O proximo bloco de foco esta reservado com ${reservedFocusMinutes} min.`;
    applyFocusMinutesButton.hidden = true;
    applyFocusMinutesButton.disabled = true;
    return;
  }

  focusTimeHelper.hidden = true;
  applyFocusMinutesButton.hidden = false;
  applyFocusMinutesButton.disabled = false;
}

function renderTaskList(taskListElement, tasks, projects) {
  if (!taskListElement) {
    return;
  }

  if (tasks.length === 0) {
    taskListElement.innerHTML = `
      <li class="empty-state">
        <strong>Nenhuma tarefa criada.</strong>
        <p>Adicione uma tarefa para organizar seu proximo ciclo de foco.</p>
      </li>
    `;
    return;
  }

  taskListElement.innerHTML = tasks.map((task) => renderTaskItem(task, projects)).join("");
}

function renderTaskItem(task, projects) {
  const completedSubtasks = task.subtasks.filter((subtask) => subtask.completed).length;
  const focusLabel = task.isFocus ? '<span class="focus-pill">Em foco</span>' : "";
  const taskActionLabel = task.isFocus && !task.subtasks.some((subtask) => subtask.isFocus)
    ? "Limpar foco"
    : "Definir foco";
  const projectLabel = getTaskProjectLabel(task, projects);
  const rhythmAction = task.subtasks.length === 0
    ? `<button class="action-button" type="button" data-action="open-task-rhythm" data-task-id="${escapeAttribute(task.id)}" data-variant="ghost">Ritmo</button>`
    : "";

  return `
    <li class="task-item" data-task-id="${escapeAttribute(task.id)}" data-complete="${String(task.completed)}" data-focus="${String(task.isFocus)}">
      <div class="task-top">
        <div class="task-info">
          <div class="task-row">
            <input class="task-toggle" data-task-id="${escapeAttribute(task.id)}" type="checkbox" ${task.completed ? "checked" : ""} aria-label="Concluir tarefa">
            <div class="task-content">
              <div class="title-row">
                <p class="task-title ${task.completed ? "is-complete" : ""}">${escapeHtml(task.title)}</p>
                ${focusLabel}
              </div>
              <p class="task-meta">${projectLabel} - ${completedSubtasks} de ${task.subtasks.length} subtarefas concluidas</p>
            </div>
          </div>
          ${renderTaskProgress(task.progress)}
          ${task.subtasks.length > 0 ? `<ul class="subtask-list">${task.subtasks.map((subtask) => renderSubtaskItem(task.id, subtask)).join("")}</ul>` : ""}
          <form class="subtask-form" data-action="add-subtask" data-task-id="${escapeAttribute(task.id)}" novalidate>
            <input name="subtaskTitle" type="text" maxlength="80" placeholder="Nova subtarefa" aria-label="Nova subtarefa">
            <input name="subtaskMinutes" type="number" min="1" max="240" inputmode="numeric" placeholder="15" aria-label="Minutos">
            <button type="submit" data-variant="secondary">Adicionar subtarefa</button>
            <p class="form-feedback" data-feedback-for-task="${escapeAttribute(task.id)}" data-visible="false" aria-live="polite"></p>
          </form>
        </div>
        <div class="task-actions">
          <button class="action-button" type="button" data-action="focus-task" data-task-id="${escapeAttribute(task.id)}" data-variant="ghost">${taskActionLabel}</button>
          ${rhythmAction}
          <button class="action-button" type="button" data-action="edit-task" data-task-id="${escapeAttribute(task.id)}" data-variant="secondary">Editar</button>
          <button class="action-button danger-action" type="button" data-action="remove-task" data-task-id="${escapeAttribute(task.id)}" data-variant="ghost">Excluir</button>
        </div>
      </div>
    </li>
  `;
}

function getTaskProjectLabel(task, projects) {
  if (!task.projectId) {
    return "Sem projeto";
  }

  const project = projects.find((entry) => entry.id === task.projectId);
  return project?.title || "Sem projeto";
}

function renderSubtaskItem(taskId, subtask) {
  const actionLabel = subtask.isFocus ? "Limpar foco" : "Definir foco";

  return `
    <li class="subtask-item" data-subtask-id="${escapeAttribute(subtask.id)}" data-focus="${String(subtask.isFocus)}">
      <div class="subtask-top">
        <div class="subtask-row">
          <input class="subtask-toggle" data-task-id="${escapeAttribute(taskId)}" data-subtask-id="${escapeAttribute(subtask.id)}" type="checkbox" ${subtask.completed ? "checked" : ""} aria-label="Concluir subtarefa">
          <div class="subtask-content">
            <div class="title-row">
              <p class="subtask-title ${subtask.completed ? "is-complete" : ""}">${escapeHtml(subtask.title)}</p>
              ${subtask.isFocus ? '<span class="focus-pill">Em foco</span>' : ""}
            </div>
            <p class="subtask-meta">${subtask.minutes} min de referencia</p>
          </div>
        </div>
        <div class="subtask-actions">
          <button class="action-button" type="button" data-action="focus-subtask" data-task-id="${escapeAttribute(taskId)}" data-subtask-id="${escapeAttribute(subtask.id)}" data-variant="ghost">${actionLabel}</button>
          <button class="action-button" type="button" data-action="edit-subtask" data-task-id="${escapeAttribute(taskId)}" data-subtask-id="${escapeAttribute(subtask.id)}" data-variant="secondary">Editar</button>
          <button class="action-button danger-action" type="button" data-action="remove-subtask" data-task-id="${escapeAttribute(taskId)}" data-subtask-id="${escapeAttribute(subtask.id)}" data-variant="ghost">Excluir</button>
        </div>
      </div>
    </li>
  `;
}

function renderTaskProgress(progress) {
  return `
    <div class="task-progress">
      <div class="task-progress-copy">
        <span>${progress.unitCompleted}/${progress.unitTotal} etapas</span>
        <span>${progress.percentage}%</span>
      </div>
      <div class="progress-track" aria-hidden="true">
        <span style="width: ${progress.percentage}%;"></span>
      </div>
    </div>
  `;
}
