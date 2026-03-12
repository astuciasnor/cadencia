const PHASES = {
  focus: {
    id: "focus",
    label: "Sessao de foco"
  },
  micro: {
    id: "micro",
    label: "Micro pausa"
  },
  long: {
    id: "long",
    label: "Pausa longa"
  }
};

const PHASE_SEQUENCE = ["focus", "micro", "long"];

const DEFAULT_SETTINGS = {
  focusMinutes: 25,
  microBreakMinutes: 5,
  longBreakMinutes: 15,
  cyclesUntilLongBreak: 4
};

export function createTimer({
  settings,
  initialSession,
  onTick = () => {},
  onStateChange = () => {},
  onPhaseChange = () => {},
  onSessionChange = () => {},
  onPhaseComplete = () => {},
  now = () => Date.now()
}) {
  let currentSettings = normalizeSettings(settings);
  let currentSession = normalizeSession(initialSession, currentSettings);
  let intervalId = null;
  let lastPhaseId = null;
  let lastStatus = null;
  let lastRemainingSeconds = null;

  restoreRunningSession();
  emitUpdates({
    forcePhase: true,
    forceState: true,
    forceTick: true,
    forceSession: true
  });

  return {
    start,
    pause,
    reset,
    nextPhase,
    applyFocusDuration,
    setSettings,
    getState() {
      return currentSession.status;
    },
    getRemainingSeconds() {
      return currentSession.remainingSeconds;
    },
    getSnapshot() {
      return cloneSession(currentSession);
    },
    destroy() {
      stopInterval();
    }
  };

  function getSnapshot() {
    return cloneSession(currentSession);
  }

  function start() {
    if (currentSession.status === "running") {
      return getSnapshot();
    }

    if (currentSession.remainingSeconds <= 0) {
      currentSession = buildIdleSession(currentSession.phaseId, currentSettings, currentSession);
    }

    const timestamp = createTimestamp(now);

    currentSession = {
      ...currentSession,
      status: "running",
      startedAt: currentSession.startedAt || timestamp,
      endsAt: createTimestamp(now, currentSession.remainingSeconds * 1000),
      updatedAt: timestamp
    };

    startInterval();
    emitUpdates({
      forceState: true,
      forceTick: true,
      forceSession: true
    });

    return getSnapshot();
  }

  function pause() {
    if (currentSession.status !== "running") {
      return getSnapshot();
    }

    syncRemainingSeconds();
    stopInterval();

    currentSession = {
      ...currentSession,
      status: currentSession.remainingSeconds === currentSession.durationSeconds ? "idle" : "paused",
      endsAt: null,
      updatedAt: createTimestamp(now)
    };

    emitUpdates({
      forceState: true,
      forceTick: true,
      forceSession: true
    });

    return getSnapshot();
  }

  function reset() {
    stopInterval();
    currentSession = buildIdleSession(currentSession.phaseId, currentSettings, currentSession);

    emitUpdates({
      forceState: true,
      forceTick: true,
      forceSession: true
    });

    return getSnapshot();
  }

  function nextPhase() {
    stopInterval();
    currentSession = buildIdleSession(getNextPhaseId(currentSession.phaseId), currentSettings, currentSession);

    emitUpdates({
      forcePhase: true,
      forceState: true,
      forceTick: true,
      forceSession: true
    });

    return getSnapshot();
  }

  function applyFocusDuration(minutes) {
    const focusDurationSeconds = sanitizeInteger(minutes, currentSettings.focusMinutes, 1, 240) * 60;
    const alreadyAppliedToCurrentFocus =
      currentSession.phaseId === "focus" &&
      currentSession.status === "idle" &&
      currentSession.durationSeconds === focusDurationSeconds;
    const alreadyReservedForNextFocus =
      currentSession.phaseId !== "focus" &&
      currentSession.nextFocusDurationSeconds === focusDurationSeconds;

    if (alreadyAppliedToCurrentFocus || alreadyReservedForNextFocus) {
      return getSnapshot();
    }

    if (currentSession.phaseId === "focus" && currentSession.status === "idle") {
      currentSession = buildIdleSession("focus", currentSettings, {
        ...currentSession,
        nextFocusDurationSeconds: focusDurationSeconds
      });
    } else {
      currentSession = {
        ...currentSession,
        nextFocusDurationSeconds: focusDurationSeconds,
        updatedAt: createTimestamp(now)
      };
    }

    emitUpdates({
      forceTick: true,
      forceSession: true
    });

    return getSnapshot();
  }

  function setSettings(nextSettings) {
    const normalizedSettings = normalizeSettings(nextSettings);
    if (areSettingsEqual(currentSettings, normalizedSettings)) {
      return getSnapshot();
    }

    currentSettings = normalizedSettings;
    stopInterval();

    currentSession = buildIdleSession(currentSession.phaseId, currentSettings, {
      ...currentSession,
      cyclesUntilLongBreak: currentSettings.cyclesUntilLongBreak,
      focusCyclesSinceLongBreak: Math.min(
        currentSession.focusCyclesSinceLongBreak,
        currentSettings.cyclesUntilLongBreak - 1
      )
    });

    emitUpdates({
      forcePhase: true,
      forceState: true,
      forceTick: true,
      forceSession: true
    });

    return getSnapshot();
  }

  function restoreRunningSession() {
    if (currentSession.status !== "running") {
      currentSession = {
        ...currentSession,
        endsAt: null
      };
      return;
    }

    syncRemainingSeconds();

    if (currentSession.remainingSeconds <= 0) {
      completeCurrentPhase();
      return;
    }

    startInterval();
  }

  function startInterval() {
    stopInterval();
    intervalId = window.setInterval(tickRunningSession, 250);
  }

  function stopInterval() {
    if (intervalId !== null) {
      window.clearInterval(intervalId);
      intervalId = null;
    }
  }

  function tickRunningSession() {
    if (currentSession.status !== "running") {
      return;
    }

    const previousRemainingSeconds = currentSession.remainingSeconds;
    syncRemainingSeconds();

    if (currentSession.remainingSeconds <= 0) {
      completeCurrentPhase();
      return;
    }

    if (currentSession.remainingSeconds !== previousRemainingSeconds) {
      emitUpdates({
        forceTick: true,
        forceSession: true
      });
    }
  }

  function syncRemainingSeconds() {
    if (!currentSession.endsAt) {
      return;
    }

    const remainingSeconds = Math.max(
      0,
      Math.ceil((new Date(currentSession.endsAt).getTime() - now()) / 1000)
    );

    currentSession = {
      ...currentSession,
      remainingSeconds,
      updatedAt: createTimestamp(now)
    };
  }

  function completeCurrentPhase() {
    stopInterval();

    const completedPhaseId = currentSession.phaseId;
    const completedSession = {
      ...cloneSession(currentSession),
      remainingSeconds: 0,
      endsAt: null,
      updatedAt: createTimestamp(now)
    };
    const transition = getPhaseCompletionTransition(currentSession, currentSettings);

    currentSession = buildIdleSession(transition.nextPhaseId, currentSettings, {
      ...currentSession,
      completedFocusCycles: transition.completedFocusCycles,
      focusCyclesSinceLongBreak: transition.focusCyclesSinceLongBreak,
      cyclesUntilLongBreak: currentSettings.cyclesUntilLongBreak
    });

    onPhaseComplete(PHASES[completedPhaseId], completedSession, getSnapshot());

    emitUpdates({
      forcePhase: true,
      forceState: true,
      forceTick: true,
      forceSession: true
    });
  }

  function emitUpdates({
    forcePhase = false,
    forceState = false,
    forceTick = false,
    forceSession = false
  } = {}) {
    const snapshot = getSnapshot();

    if (forcePhase || snapshot.phaseId !== lastPhaseId) {
      lastPhaseId = snapshot.phaseId;
      onPhaseChange(PHASES[snapshot.phaseId], snapshot);
    }

    if (forceState || snapshot.status !== lastStatus) {
      lastStatus = snapshot.status;
      onStateChange(snapshot.status, snapshot);
    }

    if (forceTick || snapshot.remainingSeconds !== lastRemainingSeconds) {
      lastRemainingSeconds = snapshot.remainingSeconds;
      onTick(snapshot.remainingSeconds, snapshot);
    }

    if (forceSession || forcePhase || forceState || forceTick) {
      onSessionChange(snapshot);
    }
  }
}

function normalizeSettings(settings) {
  return {
    focusMinutes: sanitizeInteger(settings?.focusMinutes, DEFAULT_SETTINGS.focusMinutes, 1, 120),
    microBreakMinutes: sanitizeInteger(settings?.microBreakMinutes, DEFAULT_SETTINGS.microBreakMinutes, 1, 60),
    longBreakMinutes: sanitizeInteger(settings?.longBreakMinutes, DEFAULT_SETTINGS.longBreakMinutes, 1, 90),
    cyclesUntilLongBreak: sanitizeInteger(settings?.cyclesUntilLongBreak, DEFAULT_SETTINGS.cyclesUntilLongBreak, 2, 12)
  };
}

function areSettingsEqual(currentSettings, nextSettings) {
  return currentSettings.focusMinutes === nextSettings.focusMinutes &&
    currentSettings.microBreakMinutes === nextSettings.microBreakMinutes &&
    currentSettings.longBreakMinutes === nextSettings.longBreakMinutes &&
    currentSettings.cyclesUntilLongBreak === nextSettings.cyclesUntilLongBreak;
}

function normalizeSession(rawSession, settings) {
  const phaseId = normalizePhaseId(rawSession?.phaseId);
  const durationSeconds = getPhaseDuration(phaseId, settings);

  return {
    phaseId,
    phaseLabel: PHASES[phaseId].label,
    status: normalizeStatus(rawSession?.status),
    remainingSeconds: sanitizeInteger(rawSession?.remainingSeconds, durationSeconds, 0, durationSeconds),
    durationSeconds: sanitizeInteger(rawSession?.durationSeconds, durationSeconds, 1, 43200),
    startedAt: normalizeNullableString(rawSession?.startedAt),
    endsAt: normalizeNullableString(rawSession?.endsAt),
    updatedAt: normalizeNullableString(rawSession?.updatedAt),
    completedFocusCycles: sanitizeInteger(rawSession?.completedFocusCycles, 0, 0, 9999),
    focusCyclesSinceLongBreak: sanitizeInteger(
      rawSession?.focusCyclesSinceLongBreak,
      0,
      0,
      settings.cyclesUntilLongBreak
    ),
    nextFocusDurationSeconds: sanitizeInteger(rawSession?.nextFocusDurationSeconds, 0, 0, 60 * 60 * 4),
    cyclesUntilLongBreak: sanitizeInteger(
      rawSession?.cyclesUntilLongBreak,
      settings.cyclesUntilLongBreak,
      2,
      12
    )
  };
}

function buildIdleSession(phaseId, settings, sessionBase) {
  const nextFocusDurationSeconds = sanitizeInteger(sessionBase?.nextFocusDurationSeconds, 0, 0, 60 * 60 * 4);
  const durationSeconds = phaseId === "focus" && nextFocusDurationSeconds > 0
    ? nextFocusDurationSeconds
    : getPhaseDuration(phaseId, settings);

  return {
    phaseId,
    phaseLabel: PHASES[phaseId].label,
    status: "idle",
    remainingSeconds: durationSeconds,
    durationSeconds,
    startedAt: null,
    endsAt: null,
    updatedAt: createTimestamp(),
    completedFocusCycles: sanitizeInteger(sessionBase?.completedFocusCycles, 0, 0, 9999),
    focusCyclesSinceLongBreak: sanitizeInteger(
      sessionBase?.focusCyclesSinceLongBreak,
      0,
      0,
      settings.cyclesUntilLongBreak
    ),
    nextFocusDurationSeconds: phaseId === "focus" ? 0 : nextFocusDurationSeconds,
    cyclesUntilLongBreak: settings.cyclesUntilLongBreak
  };
}

function getPhaseCompletionTransition(session, settings) {
  if (session.phaseId === "focus") {
    const completedFocusCycles = session.completedFocusCycles + 1;
    const nextCycleCount = session.focusCyclesSinceLongBreak + 1;
    const shouldUseLongBreak = nextCycleCount >= settings.cyclesUntilLongBreak;

    return {
      nextPhaseId: shouldUseLongBreak ? "long" : "micro",
      completedFocusCycles,
      focusCyclesSinceLongBreak: shouldUseLongBreak ? 0 : nextCycleCount
    };
  }

  return {
    nextPhaseId: "focus",
    completedFocusCycles: session.completedFocusCycles,
    focusCyclesSinceLongBreak: session.focusCyclesSinceLongBreak
  };
}

function getNextPhaseId(currentPhaseId) {
  const currentIndex = PHASE_SEQUENCE.indexOf(currentPhaseId);
  if (currentIndex === -1) {
    return "focus";
  }

  return PHASE_SEQUENCE[(currentIndex + 1) % PHASE_SEQUENCE.length];
}

function getPhaseDuration(phaseId, settings) {
  switch (phaseId) {
    case "micro":
      return settings.microBreakMinutes * 60;
    case "long":
      return settings.longBreakMinutes * 60;
    default:
      return settings.focusMinutes * 60;
  }
}

function normalizePhaseId(phaseId) {
  return Object.prototype.hasOwnProperty.call(PHASES, phaseId) ? phaseId : "focus";
}

function normalizeStatus(status) {
  return ["idle", "running", "paused"].includes(status) ? status : "idle";
}

function normalizeNullableString(value) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function sanitizeInteger(value, fallback, min, max) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, Math.round(numericValue)));
}

function createTimestamp(now = () => Date.now(), offsetMs = 0) {
  return new Date(now() + offsetMs).toISOString();
}

function cloneSession(session) {
  return {
    ...session
  };
}
