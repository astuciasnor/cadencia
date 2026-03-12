import { buildExecutionMarkup } from "./render-execution.js";
import { escapeAttribute, escapeHtml } from "./utils.js";

const COGNITIVE_OPTIONS = [
  { value: "", label: "Nao definido" },
  { value: "1", label: "1 - Muito baixo" },
  { value: "2", label: "2 - Baixo" },
  { value: "3", label: "3 - Medio" },
  { value: "4", label: "4 - Alto" },
  { value: "5", label: "5 - Muito alto" }
];

export function renderTaskRhythmSection({
  dom,
  view,
  activeView = "rhythm",
  execution
}) {
  if (!dom.taskRhythmContent) {
    return;
  }

  if (!view) {
    dom.taskRhythmContent.innerHTML = `
      <section class="empty-state task-rhythm-empty">
        <strong>Nenhuma tarefa ou subtarefa selecionada.</strong>
        <p>Defina um foco na aba Timer, Projetos ou Plano do dia para acompanhar aqui o ritmo e a execucao da atividade atual.</p>
      </section>
    `;
    return;
  }

  const progressHint = getOptionalCopy(view.progressHint);
  const timerHint = getOptionalCopy(view.timerHint);
  const timingProfile = resolveTimingProfile(view, execution.executionEntry);
  const taskContextLabel = view.kind === "subtask" ? "Tarefa" : "Projeto";
  const taskContextValue = view.kind === "subtask" ? view.parentTitle : view.projectTitle;
  const projectContextValue = view.kind === "subtask" ? view.projectTitle : "";

  dom.taskRhythmContent.innerHTML = `
    <div class="task-rhythm-layout task-rhythm-layout-slim">
      <div class="task-rhythm-editor-column">
        <div class="task-rhythm-subtabs" role="tablist" aria-label="Visoes da aba Ritmo">
          <button class="task-rhythm-subtab-button${activeView === "rhythm" ? " is-active" : ""}" id="task-rhythm-subtab-rhythm" type="button" role="tab" aria-selected="${String(activeView === "rhythm")}" aria-controls="task-rhythm-panel-rhythm" data-task-rhythm-view-button="rhythm" data-variant="ghost">Ritmo essencial</button>
          <button class="task-rhythm-subtab-button${activeView === "execution" ? " is-active" : ""}" id="task-rhythm-subtab-execution" type="button" role="tab" aria-selected="${String(activeView === "execution")}" aria-controls="task-rhythm-panel-execution" data-task-rhythm-view-button="execution" data-variant="ghost">Execucao opcional</button>
        </div>

        <section class="task-rhythm-subpanel${activeView === "rhythm" ? " is-active" : ""}" id="task-rhythm-panel-rhythm" role="tabpanel" aria-labelledby="task-rhythm-subtab-rhythm" ${activeView === "rhythm" ? "" : "hidden"}>
          <section class="task-rhythm-edit-card task-rhythm-edit-card-core">
            <div class="task-rhythm-focus-identity">
              <h2 class="task-rhythm-focus-title" title="${escapeAttribute(view.title)}">${escapeHtml(view.title)}</h2>
              <div class="task-rhythm-focus-meta">
                <p class="task-rhythm-focus-line"><strong>${escapeHtml(taskContextLabel)}:</strong> ${escapeHtml(taskContextValue)}</p>
                ${projectContextValue ? `<p class="task-rhythm-focus-line"><strong>Projeto:</strong> ${escapeHtml(projectContextValue)}</p>` : ""}
              </div>
            </div>
            <div class="panel-head">
              <div>
                <p class="section-label">Essencial</p>
                <h3 class="task-rhythm-card-title">So o necessario para comecar</h3>
              </div>
            </div>
            <p class="task-rhythm-form-intro">Preencha apenas o que ajuda a iniciar e retomar o foco atual. O resto pode ficar para depois.</p>
            ${renderRhythmForm(view, timingProfile)}
          </section>
        </section>

        <section class="task-rhythm-subpanel${activeView === "execution" ? " is-active" : ""}" id="task-rhythm-panel-execution" role="tabpanel" aria-labelledby="task-rhythm-subtab-execution" ${activeView === "execution" ? "" : "hidden"}>
          <section class="task-rhythm-optional-panel-shell">
            <div class="panel-head">
              <div>
                <p class="section-label">Execucao opcional</p>
                <h3 class="task-rhythm-card-title">Detalhes da mesma tarefa em foco</h3>
              </div>
            </div>
            <p class="task-rhythm-optional-copy">Essas informacoes continuam vinculadas ao mesmo foco atual exibido acima. Preencher esta parte e opcional.</p>
            <div class="task-rhythm-optional-panel">
              ${buildExecutionMarkup({
                currentFocus: execution.currentFocus,
                executionEntry: execution.executionEntry,
                projectTitle: execution.projectTitle,
                statusLabel: execution.statusLabel,
                expectedTime: execution.expectedTime,
                embedded: true,
                compact: true,
                showHeader: false
              })}
            </div>
          </section>
        </section>
      </div>

      <section class="task-rhythm-hero task-rhythm-accent-${escapeHtml(view.projectAccent)}">
        <div class="task-rhythm-head task-rhythm-head-compact">
          <p class="section-label">Ritmo do foco atual</p>
          <div class="task-rhythm-badges">
            <span class="badge">${escapeHtml(view.projectTitle)}</span>
            <span class="status-chip">${escapeHtml(view.status)}</span>
          </div>
        </div>
        ${view.parentTitle ? `<p class="task-rhythm-context-line">${escapeHtml(view.parentTitle)}</p>` : ""}
        <div class="task-rhythm-summary-strip">
          ${renderSummaryChip("Tempo previsto", timingProfile.expectedTimeLabel)}
          ${renderSummaryChip("Trabalho", timingProfile.workBlockLabel)}
          ${renderSummaryChip("Pausa curta", timingProfile.shortBreakLabel)}
          ${renderSummaryChip("Pausa longa", timingProfile.longBreakLabel)}
          ${renderSummaryChip("Ciclos estimados", timingProfile.cyclesLabel)}
          ${renderSummaryChip("Fase atual", view.supportLabel)}
          ${renderSummaryChip("Progresso", view.progressText)}
        </div>
        ${progressHint || timerHint ? `
          <div class="task-rhythm-support-stack">
            ${progressHint ? `<p class="task-rhythm-support">${escapeHtml(progressHint)}</p>` : ""}
            ${timerHint ? `<p class="task-rhythm-support">${escapeHtml(timerHint)}</p>` : ""}
          </div>
        ` : ""}
        ${renderRhythmActionBox(view)}
      </section>
    </div>
  `;
}

function renderRhythmForm(view, timingProfile) {
  if (view.kind === "standalone") {
    return `
      <section class="empty-state">
        <strong>Item avulso do plano do dia.</strong>
        <p>O painel de ritmo editavel fica disponivel para tarefas e subtarefas vinculadas a projetos.</p>
      </section>
    `;
  }

  return `
    <form id="task-rhythm-form" class="task-rhythm-form" novalidate data-rhythm-kind="${escapeAttribute(view.kind)}" data-task-id="${escapeAttribute(view.taskId || "")}" data-subtask-id="${escapeAttribute(view.subtaskId || "")}">
      <input id="task-rhythm-title" name="title" type="hidden" value="${escapeAttribute(view.title)}">

      <div class="task-rhythm-edit-grid task-rhythm-edit-grid-timing">
        <label class="field" for="task-rhythm-expected-minutes">
          <span>Tempo previsto (min)</span>
          <input id="task-rhythm-expected-minutes" name="${view.kind === "subtask" ? "minutes" : "expectedMinutesOverride"}" type="number" min="1" max="480" inputmode="numeric" value="${escapeAttribute(timingProfile.expectedMinutesInput)}">
        </label>

        <label class="field" for="task-rhythm-focus-minutes">
          <span>Trabalho (min)</span>
          <input id="task-rhythm-focus-minutes" name="focusMinutesOverride" type="number" min="1" max="240" inputmode="numeric" value="${escapeAttribute(timingProfile.workBlockInput)}">
        </label>

        <label class="field" for="task-rhythm-short-break">
          <span>Pausa curta (min)</span>
          <input id="task-rhythm-short-break" name="shortBreakMinutesOverride" type="number" min="1" max="60" inputmode="numeric" value="${escapeAttribute(timingProfile.shortBreakInput)}">
        </label>

        <label class="field" for="task-rhythm-long-break">
          <span>Pausa longa (min)</span>
          <input id="task-rhythm-long-break" name="longBreakMinutesOverride" type="number" min="1" max="120" inputmode="numeric" value="${escapeAttribute(timingProfile.longBreakInput)}">
        </label>

        <label class="field" for="task-rhythm-manual-cycles">
          <span>Ciclos (manual, opcional)</span>
          <input id="task-rhythm-manual-cycles" name="manualCycles" type="number" min="1" max="50" inputmode="numeric" value="${escapeAttribute(timingProfile.manualCyclesInput)}" placeholder="${escapeAttribute(timingProfile.autoCyclesPlaceholder)}">
        </label>
      </div>

      <div class="task-rhythm-edit-grid task-rhythm-edit-grid-cognitive">
        ${renderCognitiveField("task-rhythm-start-ease", "Facilidade de inicio", "startEase", view.cognitiveProfile?.startEase)}
        ${renderCognitiveField("task-rhythm-anxiety-level", "Ansiedade associada", "anxietyLevel", view.cognitiveProfile?.anxietyLevel)}
        ${renderCognitiveField("task-rhythm-perceived-load", "Carga percebida", "perceivedLoad", view.cognitiveProfile?.perceivedLoad)}
      </div>
    </form>
  `;
}

function renderRhythmActionBox(view) {
  return `
    <div class="task-rhythm-action-box">
      <label class="field" for="task-rhythm-next-step">
        <span>Proximo passo sugerido</span>
        <textarea id="task-rhythm-next-step" name="nextStepNote" form="task-rhythm-form" placeholder="Ex.: abrir o PDF, revisar a secao 2, enviar a primeira mensagem, montar a pauta inicial">${escapeHtml(view.nextStepNote || view.nextStep)}</textarea>
      </label>

      <div class="task-rhythm-form-actions">
        <button type="submit" form="task-rhythm-form">Salvar ritmo</button>
        <p class="task-rhythm-form-note">O detalhamento de execucao e opcional e pode ser preenchido depois.</p>
      </div>
    </div>
  `;
}

function renderCognitiveField(id, label, name, currentValue) {
  return `
    <label class="field" for="${escapeAttribute(id)}">
      <span>${escapeHtml(label)}</span>
      <select id="${escapeAttribute(id)}" name="${escapeAttribute(name)}">
        ${COGNITIVE_OPTIONS.map((option) => `
          <option value="${escapeAttribute(option.value)}" ${String(currentValue ?? "") === option.value ? "selected" : ""}>${escapeHtml(option.label)}</option>
        `).join("")}
      </select>
    </label>
  `;
}

function renderSummaryChip(label, value) {
  return `
    <article class="task-rhythm-summary-chip">
      <span class="summary-label">${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
    </article>
  `;
}

function renderStageItem(stage) {
  return `
    <article class="task-rhythm-stage-item is-${escapeHtml(stage.state)}">
      <span class="task-rhythm-stage-dot" aria-hidden="true"></span>
      <span class="task-rhythm-stage-text">${escapeHtml(stage.label)}</span>
    </article>
  `;
}

function getOptionalCopy(value) {
  const normalized = String(value ?? "").trim();
  if (!normalized || normalized.toLowerCase() === "undefined") {
    return "";
  }

  return normalized;
}

function resolveTimingProfile(view, executionEntry) {
  const expectedMinutes = getPositiveNumber(
    view.kind === "subtask"
      ? view.editableMinutes
      : executionEntry?.expectedMinutesOverride ?? getMinutesFromLabel(view.expectedTime)
  );
  const workBlockMinutes = getPositiveNumber(executionEntry?.focusMinutesOverride) ?? getMinutesFromLabel(view.workBlock);
  const shortBreakMinutes = getPositiveNumber(executionEntry?.shortBreakMinutesOverride) ?? getMinutesFromLabel(view.shortBreak);
  const longBreakMinutes = getPositiveNumber(executionEntry?.longBreakMinutesOverride) ?? getMinutesFromLabel(view.longBreak);
  const manualCycles = getPositiveNumber(executionEntry?.manualCycles);
  const autoCycles = expectedMinutes && workBlockMinutes
    ? Math.max(1, Math.ceil(expectedMinutes / workBlockMinutes))
    : null;
  const resolvedCycles = manualCycles || autoCycles;

  return {
    expectedMinutesInput: expectedMinutes ? String(expectedMinutes) : "",
    expectedTimeLabel: expectedMinutes ? `${expectedMinutes} min` : "Nao definido",
    workBlockInput: workBlockMinutes ? String(workBlockMinutes) : "",
    workBlockLabel: workBlockMinutes ? `${workBlockMinutes} min` : "Nao definido",
    shortBreakInput: shortBreakMinutes ? String(shortBreakMinutes) : "",
    shortBreakLabel: shortBreakMinutes ? `${shortBreakMinutes} min` : "Nao definido",
    longBreakInput: longBreakMinutes ? String(longBreakMinutes) : "",
    longBreakLabel: longBreakMinutes ? `${longBreakMinutes} min` : "Nao definido",
    manualCyclesInput: manualCycles ? String(manualCycles) : "",
    cyclesLabel: resolvedCycles ? formatCycles(resolvedCycles) : "Nao definido",
    autoCyclesPlaceholder: autoCycles ? `Auto: ${formatCycles(autoCycles)}` : "Auto: Nao definido"
  };
}

function getMinutesFromLabel(value) {
  const match = String(value ?? "").match(/(\d+)/);
  return match ? getPositiveNumber(match[1]) : null;
}

function getPositiveNumber(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) && numericValue > 0 ? numericValue : null;
}

function formatCycles(count) {
  return count === 1 ? "1 ciclo" : `${count} ciclos`;
}
