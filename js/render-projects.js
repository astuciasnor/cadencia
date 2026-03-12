import { escapeAttribute, escapeHtml } from "./utils.js";

export function renderProjectsSection({
  dom,
  tasks,
  projects,
  collapsedTaskIds,
  selectedProjectId
}) {
  if (!dom.projectsSummary || !dom.projectsTree) {
    return;
  }

  const projectGroups = buildProjectGroups(tasks, projects);
  const selectedProjectGroup = projectGroups.find((project) => project.id === selectedProjectId) ?? null;

  dom.projectsSummary.textContent = `${projects.length} projetos reais - ${tasks.length} tarefas`;
  renderProjectsTree({
    container: dom.projectsTree,
    selectedProjectGroup,
    collapsedTaskIds
  });
}

function renderProjectsTree({
  container,
  selectedProjectGroup,
  collapsedTaskIds
}) {
  if (!selectedProjectGroup) {
    container.innerHTML = `
      <section class="empty-state">
        <strong>Nenhum projeto selecionado.</strong>
        <p>Crie um projeto e escolha-o no seletor para visualizar a arvore estrutural.</p>
      </section>
    `;
    return;
  }

  container.innerHTML = renderProjectTreeGroup(selectedProjectGroup, collapsedTaskIds);
}

function renderProjectTreeGroup(group, collapsedTaskIds) {
  const completedTasks = group.tasks.filter((task) => task.completed).length;
  const projectStyle = [
    buildProjectStyle(group.color),
    `--project-branch-tail:${getProjectBranchTailOffset(group.tasks.at(-1), collapsedTaskIds)}px`
  ].join(";");

  return `
    <section class="project-group" data-project-id="${escapeAttribute(group.id)}" style="${projectStyle}">
      <header class="project-group-head">
        <div class="project-group-brand">
          <span class="project-group-swatch" aria-hidden="true"></span>
          <div class="project-group-copy">
            <h3 class="project-group-title">
              <span class="project-group-kicker">Projeto:</span>
              <span class="project-group-title-value">${escapeHtml(group.title)}</span>
            </h3>
          </div>
        </div>
        <div class="project-group-actions">
          <button class="action-button project-node-action-button" type="button" data-project-action="add-task" data-project-id="${escapeAttribute(group.id)}" data-variant="secondary">Adicionar tarefa</button>
          <button class="action-button project-node-action-button" type="button" data-project-action="edit-project" data-project-id="${escapeAttribute(group.id)}" data-variant="ghost">Editar</button>
          <button class="action-button project-node-action-button" type="button" data-project-action="duplicate-project" data-project-id="${escapeAttribute(group.id)}" data-variant="ghost">Duplicar</button>
          <span class="inline-summary">${completedTasks}/${group.tasks.length} concluidas</span>
        </div>
      </header>
      ${group.tasks.length > 0
        ? `
          <ul class="project-branch-list">
            ${group.tasks.map((task, index) => renderProjectTask(task, collapsedTaskIds, buildBranchColor(group.color, index))).join("")}
          </ul>
        `
        : `
          <section class="empty-state">
            <strong>Projeto sem tarefas vinculadas.</strong>
            <p>Use o botao Adicionar tarefa ou a aba Timer para comecar a estruturar este projeto.</p>
          </section>
        `}
    </section>
  `;
}

function renderProjectTask(task, collapsedTaskIds, branchColor) {
  const hasFocusedSubtask = task.subtasks.some((subtask) => subtask.isFocus);
  const isSelected = task.isFocus && !hasFocusedSubtask;
  const isCollapsed = collapsedTaskIds.has(task.id);
  const hasChildren = task.subtasks.length > 0;

  return `
    <li class="project-branch-item" data-task-id="${escapeAttribute(task.id)}" style="${buildBranchStyle(branchColor)}">
      <div class="project-node project-node-task${isSelected ? " is-selected" : ""}${task.completed ? " is-complete" : ""}">
        <label class="project-node-check" aria-label="Concluir tarefa">
          <input class="projects-task-toggle" data-task-id="${escapeAttribute(task.id)}" type="checkbox" ${task.completed ? "checked" : ""}>
        </label>
        <button class="project-node-trigger" type="button" data-project-action="focus-task" data-task-id="${escapeAttribute(task.id)}">
          <span class="project-node-title-row">
            <span class="project-node-marker" aria-hidden="true"></span>
            <span class="project-node-eyebrow">Tarefa:</span>
            <span class="project-node-title">${escapeHtml(task.title)}</span>
            ${isSelected ? '<span class="focus-pill">Em foco</span>' : ""}
          </span>
        </button>
        <div class="project-node-actions project-node-actions-task" aria-label="Acoes da tarefa">
          <button class="action-button project-node-action-button" type="button" data-project-action="edit-task" data-task-id="${escapeAttribute(task.id)}" data-variant="secondary">Editar</button>
          <button class="action-button project-node-action-button" type="button" data-project-action="move-task" data-task-id="${escapeAttribute(task.id)}" data-variant="ghost">Mover</button>
          ${!hasChildren
            ? `<button class="action-button project-node-action-button" type="button" data-project-action="open-task-rhythm" data-task-id="${escapeAttribute(task.id)}" data-variant="ghost">Ritmo</button>`
            : ""}
          <button class="action-button project-node-action-button" type="button" data-project-action="add-subtask" data-task-id="${escapeAttribute(task.id)}" data-variant="secondary">+Subtarefa</button>
          <button class="action-button project-node-action-button danger-action" type="button" data-project-action="remove-task" data-task-id="${escapeAttribute(task.id)}" data-variant="ghost">Excluir</button>
          ${hasChildren ? `
            <button class="project-node-collapse" type="button" data-project-action="toggle-task-branch" data-task-id="${escapeAttribute(task.id)}" aria-expanded="${String(!isCollapsed)}">
              ${isCollapsed ? "Expandir" : "Recolher"}
            </button>
          ` : ""}
        </div>
      </div>
      ${hasChildren && !isCollapsed ? `
        <ul class="project-subtree">
          ${task.subtasks.map((subtask, index) => renderProjectSubtask(task.id, subtask, buildLeafColor(branchColor, index))).join("")}
        </ul>
      ` : ""}
    </li>
  `;
}

function renderProjectSubtask(taskId, subtask, branchColor) {
  return `
    <li class="project-subtree-item" data-subtask-id="${escapeAttribute(subtask.id)}" style="${buildBranchStyle(branchColor)}">
      <div class="project-node project-node-subtask${subtask.isFocus ? " is-selected" : ""}${subtask.completed ? " is-complete" : ""}">
        <label class="project-node-check" aria-label="Concluir subtarefa">
          <input class="projects-subtask-toggle" data-task-id="${escapeAttribute(taskId)}" data-subtask-id="${escapeAttribute(subtask.id)}" type="checkbox" ${subtask.completed ? "checked" : ""}>
        </label>
        <button class="project-node-trigger" type="button" data-project-action="focus-subtask" data-task-id="${escapeAttribute(taskId)}" data-subtask-id="${escapeAttribute(subtask.id)}">
          <span class="project-node-title-row">
            <span class="project-node-marker project-node-marker-subtask" aria-hidden="true"></span>
            <span class="project-node-eyebrow project-node-eyebrow-subtask">Subtarefa:</span>
            <span class="project-node-title">${escapeHtml(subtask.title)}</span>
            ${subtask.isFocus ? '<span class="focus-pill">Em foco</span>' : ""}
          </span>
        </button>
        <div class="project-node-actions project-node-actions-subtask" aria-label="Acoes da subtarefa">
          <button class="action-button project-node-action-button" type="button" data-project-action="edit-subtask" data-task-id="${escapeAttribute(taskId)}" data-subtask-id="${escapeAttribute(subtask.id)}" data-variant="secondary">Editar</button>
          <button class="action-button project-node-action-button" type="button" data-project-action="open-subtask-rhythm" data-task-id="${escapeAttribute(taskId)}" data-subtask-id="${escapeAttribute(subtask.id)}" data-variant="ghost">Ritmo</button>
          <button class="action-button project-node-action-button danger-action" type="button" data-project-action="remove-subtask" data-task-id="${escapeAttribute(taskId)}" data-subtask-id="${escapeAttribute(subtask.id)}" data-variant="ghost">Excluir</button>
        </div>
      </div>
    </li>
  `;
}

function buildProjectGroups(tasks, projects) {
  return projects.map((project) => ({
    ...project,
    description: "Projeto real criado pelo usuario. As tarefas abaixo compoem a estrutura ativa deste projeto.",
    tasks: tasks.filter((task) => task.projectId === project.id)
  }));
}

function buildProjectStyle(color) {
  return [
    `--project-accent:${color}`,
    `--project-accent-soft:${hexToRgba(color, 0.18)}`,
    `--project-accent-strong:${hexToRgba(color, 0.34)}`,
    `--project-accent-glow:${hexToRgba(color, 0.26)}`
  ].join(";");
}

function buildBranchStyle(color) {
  return [
    `--branch-accent:${color}`,
    `--branch-accent-soft:${hexToRgba(color, 0.18)}`,
    `--branch-accent-strong:${hexToRgba(color, 0.34)}`,
    `--branch-panel-top:${hexToRgba(shiftHexColor(color, -28), 0.56)}`,
    `--branch-panel-bottom:${hexToRgba(shiftHexColor(color, -54), 0.96)}`,
    `--branch-node-top:${hexToRgba(shiftHexColor(color, -6), 0.96)}`,
    `--branch-node-mid:${hexToRgba(shiftHexColor(color, -22), 0.98)}`,
    `--branch-node-bottom:${hexToRgba(shiftHexColor(color, -40), 0.99)}`,
    `--branch-node-border:${hexToRgba(shiftHexColor(color, 8), 0.24)}`,
    `--branch-node-shadow:${hexToRgba(shiftHexColor(color, -60), 0.24)}`
  ].join(";");
}

function buildBranchColor(projectColor, index) {
  return "#57BA8D";
}

function buildLeafColor(branchColor, index) {
  return branchColor;
}

function getProjectBranchTailOffset(task, collapsedTaskIds) {
  if (!task) {
    return 174;
  }

  const taskBaseTail = 31;
  const subtreeGap = 8;
  const subtaskHeight = 66;
  const subtaskGap = 6;
  const isCollapsed = collapsedTaskIds?.has(task.id);
  const visibleSubtaskCount = isCollapsed ? 0 : task.subtasks.length;

  if (visibleSubtaskCount === 0) {
    return taskBaseTail;
  }

  return taskBaseTail +
    subtreeGap +
    (visibleSubtaskCount * subtaskHeight) +
    ((visibleSubtaskCount - 1) * subtaskGap);
}

function hexToRgba(hexColor, alpha) {
  const safeHex = String(hexColor || "").replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(safeHex)) {
    return `rgba(122, 164, 255, ${alpha})`;
  }

  const red = Number.parseInt(safeHex.slice(0, 2), 16);
  const green = Number.parseInt(safeHex.slice(2, 4), 16);
  const blue = Number.parseInt(safeHex.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function shiftHexColor(hexColor, amount) {
  const safeHex = String(hexColor || "").replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(safeHex)) {
    return "#7AA4FF";
  }

  const red = clampChannel(Number.parseInt(safeHex.slice(0, 2), 16) + amount);
  const green = clampChannel(Number.parseInt(safeHex.slice(2, 4), 16) + amount);
  const blue = clampChannel(Number.parseInt(safeHex.slice(4, 6), 16) + amount);

  return `#${toHex(red)}${toHex(green)}${toHex(blue)}`;
}

function clampChannel(value) {
  return Math.max(0, Math.min(255, value));
}

function toHex(value) {
  return value.toString(16).padStart(2, "0").toUpperCase();
}
