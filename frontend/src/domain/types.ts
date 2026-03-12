export type ProjectId = string;
export type TaskId = string;
export type SubtaskId = string;
export type DayPlanItemId = string;

export type Priority = "A" | "M" | "B";
export type FocusKind = "task" | "subtask" | "standalone";
export type TimerPhase = "focus" | "micro" | "long";
export type TimerStatus = "idle" | "running" | "paused";
export type ExecutionMode = "solo" | "meeting";

export interface CognitiveProfile {
  startEase: 1 | 2 | 3 | 4 | 5 | null;
  anxietyLevel: 1 | 2 | 3 | 4 | 5 | null;
  perceivedLoad: 1 | 2 | 3 | 4 | 5 | null;
}

export interface Project {
  id: ProjectId;
  title: string;
  color: string;
  createdAt: string;
  updatedAt: string;
  isProvisional?: boolean;
}

export interface Subtask {
  id: SubtaskId;
  title: string;
  minutes: number;
  completed: boolean;
  completedAt: string | null;
  isFocus: boolean;
  nextStepNote: string;
  cognitiveProfile: CognitiveProfile;
}

export interface Task {
  id: TaskId;
  projectId: ProjectId;
  title: string;
  completed: boolean;
  completedAt: string | null;
  isFocus: boolean;
  nextStepNote: string;
  cognitiveProfile: CognitiveProfile;
  subtasks: Subtask[];
}

export type DayPlanItem =
  | {
      id: DayPlanItemId;
      kind: "standalone";
      title: string;
      priority: Priority;
      completed: boolean;
      createdAt: string;
    }
  | {
      id: DayPlanItemId;
      kind: "task";
      title: string;
      priority: Priority;
      completed: boolean;
      sourceTaskId: TaskId;
      sourceSubtaskId: null;
      createdAt: string;
    }
  | {
      id: DayPlanItemId;
      kind: "subtask";
      title: string;
      priority: Priority;
      completed: boolean;
      sourceTaskId: TaskId;
      sourceSubtaskId: SubtaskId;
      createdAt: string;
    };

export interface DayPlanState {
  items: DayPlanItem[];
  activeItemId: DayPlanItemId | null;
}

export interface ExecutionEntry {
  mode: ExecutionMode;
  materials: string;
  actions: string[];
  contacts: string;
  phones: string;
  notes: string;
  instructions: string;
  updatedAt: string | null;
}

export interface TimerSettings {
  focusMinutes: number;
  microBreakMinutes: number;
  longBreakMinutes: number;
  dailyTarget: number;
  cyclesUntilLongBreak: number;
}

export interface TimerSession {
  phaseId: TimerPhase;
  phaseLabel: string;
  status: TimerStatus;
  remainingSeconds: number;
  durationSeconds: number;
  completedFocusCycles: number;
  focusCyclesSinceLongBreak: number;
  nextFocusDurationSeconds: number;
  startedAt?: string | null;
  endsAt?: string | null;
  updatedAt?: string | null;
}

export type CurrentFocus =
  | {
      kind: "task";
      origin: "projects";
      sourceTaskId: TaskId;
      sourceSubtaskId: null;
      taskId: TaskId;
      subtaskId: null;
      label: string;
      description: string;
    }
  | {
      kind: "subtask";
      origin: "projects";
      sourceTaskId: TaskId;
      sourceSubtaskId: SubtaskId;
      taskId: TaskId;
      subtaskId: SubtaskId;
      label: string;
      description: string;
      minutes: number | null;
    }
  | {
      kind: "standalone";
      origin: "day-plan";
      dayPlanItemId: DayPlanItemId;
      taskId: null;
      subtaskId: null;
      sourceTaskId: null;
      sourceSubtaskId: null;
      label: string;
      description: string;
    }
  | null;

export interface DayHistoryEntry {
  date: string;
  completedFocusSessions: number;
  completedMicroPauses: number;
  completedLongBreaks: number;
  focusedMinutes: number;
  updatedAt: string | null;
}

export interface AppState {
  version: number;
  updatedAt: string | null;
  settings: TimerSettings;
  projects: Project[];
  tasks: Task[];
  dayPlan: DayPlanState;
  execution: Record<string, ExecutionEntry>;
  currentFocus: CurrentFocus;
  currentSession: TimerSession;
  history: Record<string, DayHistoryEntry>;
}
