export function renderSummarySection({
  dom,
  todayHistory,
  currentFocus
}) {
  if (!todayHistory) {
    return;
  }

  if (dom.summarySessionsToday) {
    dom.summarySessionsToday.textContent = String(todayHistory.completedFocusSessions);
  }

  if (dom.summaryMinutesToday) {
    dom.summaryMinutesToday.textContent = `${todayHistory.focusedMinutes} min`;
  }

  if (dom.summaryCurrentTask) {
    dom.summaryCurrentTask.textContent = currentFocus?.taskTitle || "Nenhuma tarefa";
  }

  if (dom.summaryCurrentSubtask) {
    dom.summaryCurrentSubtask.textContent = currentFocus?.subtaskTitle || "Nenhuma subtarefa";
  }
}
