import { escapeHtml } from "./utils.js";

export function renderDayProgressSection({
  dom,
  view
}) {
  if (!dom.dayProgressContent) {
    return;
  }

  if (!view) {
    dom.dayProgressContent.innerHTML = `
      <section class="empty-state day-progress-empty">
        <strong>Nenhum dado diario disponivel.</strong>
        <p>Use o timer e conclua tarefas ao longo do dia para acompanhar aqui o ritmo geral de trabalho.</p>
      </section>
    `;
    return;
  }

  dom.dayProgressContent.innerHTML = `
    <div class="day-progress-layout">
      <section class="day-progress-hero">
        <div class="day-progress-hero-head">
          <div>
            <p class="section-label">Progresso do dia</p>
            <h2 id="day-progress-title" class="day-progress-title">${escapeHtml(view.overallProgressLabel)}</h2>
            <p class="day-progress-subtitle">${escapeHtml(view.supportText)}</p>
          </div>
          <span class="inline-summary">${view.overallProgressPercentage}%</span>
        </div>

        <div class="task-progress">
          <div class="task-progress-copy">
            <span>Progresso geral do dia</span>
            <span>${view.overallProgressPercentage}%</span>
          </div>
          <div class="progress-track" aria-hidden="true">
            <span style="width: ${view.overallProgressPercentage}%;"></span>
          </div>
        </div>
      </section>

      <section class="day-progress-metrics">
        ${renderMetric("Sessoes de foco concluidas", String(view.sessionsToday))}
        ${renderMetric("Minutos focados hoje", `${view.focusedMinutesToday} min`)}
        ${renderMetric("Tarefas concluidas hoje", String(view.completedTasksToday))}
        ${renderMetric("Subtarefas concluidas hoje", String(view.completedSubtasksToday))}
      </section>

      <section class="day-progress-focus-card">
        <p class="section-label">Foco atual</p>
        <strong class="day-progress-focus-title">${escapeHtml(view.currentFocusLabel)}</strong>
        <p class="day-progress-focus-copy">${escapeHtml(view.currentFocusMeta)}</p>
      </section>
    </div>
  `;
}

function renderMetric(label, value) {
  return `
    <article class="day-progress-metric">
      <span class="summary-label">${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
    </article>
  `;
}
