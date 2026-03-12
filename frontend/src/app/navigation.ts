export const APP_TABS = [
  {
    id: "timer",
    label: "Timer"
  },
  {
    id: "projects",
    label: "Projetos"
  },
  {
    id: "day-plan",
    label: "Plano do dia"
  },
  {
    id: "task-rhythm",
    label: "Ritmo"
  },
  {
    id: "day-progress",
    label: "Progresso"
  }
] as const;

export type AppTabId = (typeof APP_TABS)[number]["id"];
