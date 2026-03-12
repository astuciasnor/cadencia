import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Progress } from "@/components/ui/progress";
import { useAppStore } from "@/stores/app-store";

function formatTimerLabel(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = Math.max(0, totalSeconds % 60)
    .toString()
    .padStart(2, "0");

  return `${minutes}:${seconds}`;
}

function getTodayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function TimerPage() {
  const currentFocus = useAppStore((store) => store.state.currentFocus);
  const session = useAppStore((store) => store.state.currentSession);
  const settings = useAppStore((store) => store.state.settings);
  const history = useAppStore((store) => store.state.history);
  const updateTimerSettings = useAppStore((store) => store.updateTimerSettings);
  const startTimer = useAppStore((store) => store.startTimer);
  const pauseTimer = useAppStore((store) => store.pauseTimer);
  const resetTimer = useAppStore((store) => store.resetTimer);
  const skipTimerPhase = useAppStore((store) => store.skipTimerPhase);
  const tickTimer = useAppStore((store) => store.tickTimer);

  const [settingsForm, setSettingsForm] = useState({
    focusMinutes: String(settings.focusMinutes),
    microBreakMinutes: String(settings.microBreakMinutes),
    longBreakMinutes: String(settings.longBreakMinutes),
    dailyTarget: String(settings.dailyTarget),
    cyclesUntilLongBreak: String(settings.cyclesUntilLongBreak)
  });

  useEffect(() => {
    setSettingsForm({
      focusMinutes: String(settings.focusMinutes),
      microBreakMinutes: String(settings.microBreakMinutes),
      longBreakMinutes: String(settings.longBreakMinutes),
      dailyTarget: String(settings.dailyTarget),
      cyclesUntilLongBreak: String(settings.cyclesUntilLongBreak)
    });
  }, [settings]);

  useEffect(() => {
    if (session.status !== "running") {
      return;
    }

    const intervalId = window.setInterval(() => {
      tickTimer();
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [session.status, tickTimer]);

  const todayHistory = history[getTodayKey()] ?? {
    completedFocusSessions: 0,
    completedMicroPauses: 0,
    completedLongBreaks: 0,
    focusedMinutes: 0
  };
  const progressValue = session.durationSeconds > 0
    ? ((session.durationSeconds - session.remainingSeconds) / session.durationSeconds) * 100
    : 0;
  const hasFocus = Boolean(currentFocus);

  return (
    <Card>
      <CardContent className="grid gap-4 p-5 xl:grid-cols-[minmax(0,1fr),320px]">
        <div className="grid gap-4">
          <PageHeader
            eyebrow="Timer"
            title="Superfície central de execução"
            description="Sessão real, com estado persistido, histórico diário e troca de fase controlada."
            actions={
              <div className="flex flex-wrap gap-2">
                <Badge variant="blue">{session.phaseLabel}</Badge>
                <Badge variant={session.status === "running" ? "success" : "muted"}>{session.status}</Badge>
              </div>
            }
          />

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr),220px]">
            <div className="rounded-[1.5rem] border border-blue-400/18 bg-gradient-to-r from-blue-500/16 via-violet-500/16 to-cyan-400/10 p-4 shadow-glow">
              <p className="text-[0.68rem] font-extrabold uppercase tracking-[0.2em] text-slate-300">Foco atual</p>
              <div className="mt-3 rounded-[1.2rem] border border-white/10 bg-slate-950/68 px-4 py-4">
                <p className="text-lg font-semibold text-white">
                  {currentFocus ? currentFocus.label : "Nenhum foco definido"}
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-300">
                  {currentFocus
                    ? currentFocus.description
                    : "Defina o foco em Projetos antes de iniciar a sessão."}
                </p>
              </div>
            </div>

            <div className="grid gap-3 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
              <div>
                <p className="text-[0.68rem] font-extrabold uppercase tracking-[0.2em] text-slate-500">Hoje</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  {todayHistory.completedFocusSessions} sessões concluídas
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-2xl border border-white/8 bg-slate-950/45 px-3 py-3 text-slate-200">
                  {todayHistory.focusedMinutes} min
                </div>
                <div className="rounded-2xl border border-white/8 bg-slate-950/45 px-3 py-3 text-slate-200">
                  {todayHistory.completedLongBreaks} pausas longas
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-[0.68rem] font-extrabold uppercase tracking-[0.2em] text-slate-500">Sessão</p>
                <strong className="mt-2 block text-[4.8rem] font-semibold leading-none tracking-[-0.08em] text-white md:text-[5.4rem]">
                  {formatTimerLabel(session.remainingSeconds)}
                </strong>
              </div>
              <div className="grid gap-2 text-sm text-slate-300">
                <p>Duração da fase: {Math.round(session.durationSeconds / 60)} min</p>
                <p>Ciclos concluídos: {session.completedFocusCycles}</p>
              </div>
            </div>

            <Progress value={progressValue} />

            <div className="flex flex-wrap gap-2">
              <Button onClick={startTimer} disabled={!hasFocus || session.status === "running"}>
                {session.status === "paused" ? "Retomar" : "Começar"}
              </Button>
              <Button variant="secondary" onClick={pauseTimer} disabled={session.status !== "running"}>
                Pausar
              </Button>
              <Button variant="ghost" onClick={resetTimer}>
                Reiniciar fase
              </Button>
              <Button variant="ghost" onClick={skipTimerPhase}>
                Próxima fase
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
            <p className="text-[0.68rem] font-extrabold uppercase tracking-[0.2em] text-slate-500">Configurações</p>
            <div className="mt-3 grid gap-3">
              <label className="grid gap-2 text-sm text-slate-200">
                <span>Foco</span>
                <Input
                  type="number"
                  min={5}
                  max={180}
                  value={settingsForm.focusMinutes}
                  onChange={(event) =>
                    setSettingsForm((current) => ({ ...current, focusMinutes: event.target.value }))
                  }
                />
              </label>
              <label className="grid gap-2 text-sm text-slate-200">
                <span>Micro pausa</span>
                <Input
                  type="number"
                  min={1}
                  max={30}
                  value={settingsForm.microBreakMinutes}
                  onChange={(event) =>
                    setSettingsForm((current) => ({ ...current, microBreakMinutes: event.target.value }))
                  }
                />
              </label>
              <label className="grid gap-2 text-sm text-slate-200">
                <span>Pausa longa</span>
                <Input
                  type="number"
                  min={5}
                  max={60}
                  value={settingsForm.longBreakMinutes}
                  onChange={(event) =>
                    setSettingsForm((current) => ({ ...current, longBreakMinutes: event.target.value }))
                  }
                />
              </label>
              <label className="grid gap-2 text-sm text-slate-200">
                <span>Meta diária</span>
                <Input
                  type="number"
                  min={1}
                  max={20}
                  value={settingsForm.dailyTarget}
                  onChange={(event) =>
                    setSettingsForm((current) => ({ ...current, dailyTarget: event.target.value }))
                  }
                />
              </label>
              <label className="grid gap-2 text-sm text-slate-200">
                <span>Ciclos até pausa longa</span>
                <Input
                  type="number"
                  min={2}
                  max={8}
                  value={settingsForm.cyclesUntilLongBreak}
                  onChange={(event) =>
                    setSettingsForm((current) => ({ ...current, cyclesUntilLongBreak: event.target.value }))
                  }
                />
              </label>
            </div>

            <div className="mt-4 flex justify-end">
              <Button
                onClick={() =>
                  updateTimerSettings({
                    focusMinutes: Number(settingsForm.focusMinutes),
                    microBreakMinutes: Number(settingsForm.microBreakMinutes),
                    longBreakMinutes: Number(settingsForm.longBreakMinutes),
                    dailyTarget: Number(settingsForm.dailyTarget),
                    cyclesUntilLongBreak: Number(settingsForm.cyclesUntilLongBreak)
                  })
                }
              >
                Salvar ajustes
              </Button>
            </div>
          </section>
        </div>
      </CardContent>
    </Card>
  );
}
