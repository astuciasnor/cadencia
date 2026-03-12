export const APP_STATE_VERSION = 1;

export const PROVISIONAL_PROJECT_ID = "project-unassigned";
export const PROVISIONAL_PROJECT_TITLE = "Sem projeto";

export const DEFAULT_PROJECT_COLOR = "#7AA4FF";

export const PROJECT_COLOR_PALETTE = [
  "#7AA4FF",
  "#61C79D",
  "#E9B949",
  "#E98B7B",
  "#A78BFA"
] as const;

export const TIMER_PHASES = {
  focus: {
    id: "focus",
    label: "Sessão de foco"
  },
  micro: {
    id: "micro",
    label: "Micro pausa"
  },
  long: {
    id: "long",
    label: "Pausa longa"
  }
} as const;
