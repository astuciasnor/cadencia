import { TIMER_PHASES } from "./constants";
import type { TimerSession, TimerSettings } from "./types";

function clampMinutes(value: unknown, fallback: number, min: number, max: number) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, Math.round(numeric)));
}

function normalizeTimestamp(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function buildSessionPhase(
  phaseId: TimerSession["phaseId"],
  settings: TimerSettings,
  counts: Pick<TimerSession, "completedFocusCycles" | "focusCyclesSinceLongBreak">
): TimerSession {
  const durationSeconds = getPhaseDurationSeconds(phaseId, settings);

  return {
    phaseId,
    phaseLabel: TIMER_PHASES[phaseId].label,
    status: "idle",
    remainingSeconds: durationSeconds,
    durationSeconds,
    completedFocusCycles: counts.completedFocusCycles,
    focusCyclesSinceLongBreak: counts.focusCyclesSinceLongBreak,
    nextFocusDurationSeconds: settings.focusMinutes * 60,
    startedAt: null,
    endsAt: null,
    updatedAt: new Date().toISOString()
  };
}

export function createDefaultTimerSettings(): TimerSettings {
  return {
    focusMinutes: 25,
    microBreakMinutes: 5,
    longBreakMinutes: 15,
    dailyTarget: 6,
    cyclesUntilLongBreak: 4
  };
}

export function createDefaultTimerSession(settings: TimerSettings = createDefaultTimerSettings()): TimerSession {
  return {
    phaseId: TIMER_PHASES.focus.id,
    phaseLabel: TIMER_PHASES.focus.label,
    status: "idle",
    remainingSeconds: settings.focusMinutes * 60,
    durationSeconds: settings.focusMinutes * 60,
    completedFocusCycles: 0,
    focusCyclesSinceLongBreak: 0,
    nextFocusDurationSeconds: settings.focusMinutes * 60
  };
}

export function sanitizeTimerSettings(value: Partial<TimerSettings> | null | undefined): TimerSettings {
  return {
    focusMinutes: clampMinutes(value?.focusMinutes, 25, 5, 180),
    microBreakMinutes: clampMinutes(value?.microBreakMinutes, 5, 1, 30),
    longBreakMinutes: clampMinutes(value?.longBreakMinutes, 15, 5, 60),
    dailyTarget: clampMinutes(value?.dailyTarget, 6, 1, 20),
    cyclesUntilLongBreak: clampMinutes(value?.cyclesUntilLongBreak, 4, 2, 8)
  };
}

export function sanitizeTimerSession(
  value: Partial<TimerSession> | null | undefined,
  settings: TimerSettings = createDefaultTimerSettings()
): TimerSession {
  const defaults = createDefaultTimerSession(settings);
  const phase = value?.phaseId === "micro" || value?.phaseId === "long" ? value.phaseId : "focus";
  const phaseLabel = TIMER_PHASES[phase].label;
  const durationSeconds = Math.max(60, Math.round(Number(value?.durationSeconds) || defaults.durationSeconds));
  const remainingSeconds = Math.max(0, Math.round(Number(value?.remainingSeconds) || durationSeconds));

  return {
    phaseId: phase,
    phaseLabel,
    status: value?.status === "running" || value?.status === "paused" ? value.status : "idle",
    remainingSeconds,
    durationSeconds,
    completedFocusCycles: Math.max(0, Math.round(Number(value?.completedFocusCycles) || 0)),
    focusCyclesSinceLongBreak: Math.max(0, Math.round(Number(value?.focusCyclesSinceLongBreak) || 0)),
    nextFocusDurationSeconds: Math.max(
      60,
      Math.round(Number(value?.nextFocusDurationSeconds) || settings.focusMinutes * 60)
    ),
    startedAt: normalizeTimestamp(value?.startedAt),
    endsAt: normalizeTimestamp(value?.endsAt),
    updatedAt: normalizeTimestamp(value?.updatedAt)
  };
}

export function getPhaseDurationSeconds(phaseId: TimerSession["phaseId"], settings: TimerSettings) {
  if (phaseId === "micro") {
    return settings.microBreakMinutes * 60;
  }

  if (phaseId === "long") {
    return settings.longBreakMinutes * 60;
  }

  return settings.focusMinutes * 60;
}

export function startTimerSession(session: TimerSession): TimerSession {
  if (session.status === "running") {
    return session;
  }

  const timestamp = new Date();
  return {
    ...session,
    status: "running",
    startedAt: session.startedAt ?? timestamp.toISOString(),
    endsAt: new Date(timestamp.getTime() + session.remainingSeconds * 1000).toISOString(),
    updatedAt: timestamp.toISOString()
  };
}

export function pauseTimerSession(session: TimerSession): TimerSession {
  if (session.status !== "running") {
    return session;
  }

  return {
    ...session,
    status: "paused",
    endsAt: null,
    updatedAt: new Date().toISOString()
  };
}

export function resetTimerSession(
  settings: TimerSettings,
  session: TimerSession = createDefaultTimerSession(settings)
): TimerSession {
  return buildSessionPhase(session.phaseId, settings, {
    completedFocusCycles: session.completedFocusCycles,
    focusCyclesSinceLongBreak: session.focusCyclesSinceLongBreak
  });
}

export function advanceTimerSession(session: TimerSession, settings: TimerSettings): TimerSession {
  const completedFocusCycles = session.completedFocusCycles + (session.phaseId === "focus" ? 1 : 0);
  const focusCyclesSinceLongBreak = session.phaseId === "focus"
    ? session.focusCyclesSinceLongBreak + 1
    : session.phaseId === "long"
      ? 0
      : session.focusCyclesSinceLongBreak;

  const nextPhase = session.phaseId === "focus"
    ? focusCyclesSinceLongBreak >= settings.cyclesUntilLongBreak
      ? "long"
      : "micro"
    : "focus";

  return buildSessionPhase(nextPhase, settings, {
    completedFocusCycles,
    focusCyclesSinceLongBreak
  });
}

export function tickTimerSession(session: TimerSession, settings: TimerSettings) {
  if (session.status !== "running") {
    return {
      session,
      completedPhase: null as TimerSession["phaseId"] | null
    };
  }

  if (session.remainingSeconds > 1) {
    return {
      session: {
        ...session,
        remainingSeconds: session.remainingSeconds - 1,
        updatedAt: new Date().toISOString()
      },
      completedPhase: null as TimerSession["phaseId"] | null
    };
  }

  return {
    session: advanceTimerSession(session, settings),
    completedPhase: session.phaseId
  };
}
