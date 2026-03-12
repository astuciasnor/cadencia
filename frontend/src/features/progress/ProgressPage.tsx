import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Progress } from "@/components/ui/progress";
import { useAppStore } from "@/stores/app-store";

function getTodayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function percentage(completed: number, total: number) {
  if (total <= 0) {
    return 0;
  }

  return (completed / total) * 100;
}

export function ProgressPage() {
  const currentFocus = useAppStore((store) => store.state.currentFocus);
  const settings = useAppStore((store) => store.state.settings);
  const history = useAppStore((store) => store.state.history);
  const tasks = useAppStore((store) => store.state.tasks);
  const dayPlan = useAppStore((store) => store.state.dayPlan);

  const subtasks = tasks.flatMap((task) => task.subtasks);
  const completedTasks = tasks.filter((task) => task.completed).length;
  const completedSubtasks = subtasks.filter((subtask) => subtask.completed).length;
  const completedDayPlanItems = dayPlan.items.filter((item) => item.completed).length;
  const todayHistory = history[getTodayKey()] ?? {
    completedFocusSessions: 0,
    completedMicroPauses: 0,
    completedLongBreaks: 0,
    focusedMinutes: 0
  };

  const sessionProgress = percentage(todayHistory.completedFocusSessions, settings.dailyTarget);
  const taskProgress = percentage(completedTasks, tasks.length);
  const subtaskProgress = percentage(completedSubtasks, subtasks.length);
  const dayPlanProgress = percentage(completedDayPlanItems, dayPlan.items.length);
  const overallProgress = percentage(
    completedTasks + completedSubtasks + completedDayPlanItems,
    tasks.length + subtasks.length + dayPlan.items.length
  );

  return (
    <Card>
      <CardContent className="grid gap-4 p-5">
        <PageHeader
          eyebrow="Progresso"
          title="Leitura agregada do dia"
          description="Resumo real do que foi executado, concluído e selecionado na base atual da V2."
          actions={
            currentFocus ? (
              <Badge variant="blue">Foco atual: {currentFocus.label}</Badge>
            ) : (
              <Badge variant="muted">Sem foco atual</Badge>
            )
          }
        />

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Sessões de foco" value={String(todayHistory.completedFocusSessions)} detail={`meta ${settings.dailyTarget}`} />
          <MetricCard label="Minutos focados" value={String(todayHistory.focusedMinutes)} detail="hoje" />
          <MetricCard label="Tarefas concluídas" value={String(completedTasks)} detail={`${tasks.length} no total`} />
          <MetricCard label="Subtarefas concluídas" value={String(completedSubtasks)} detail={`${subtasks.length} no total`} />
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr),minmax(0,1fr)]">
          <section className="grid gap-4 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
            <ProgressBlock label="Meta diária de sessões" value={sessionProgress} detail={`${todayHistory.completedFocusSessions}/${settings.dailyTarget}`} />
            <ProgressBlock label="Tarefas concluídas" value={taskProgress} detail={`${completedTasks}/${tasks.length || 0}`} />
            <ProgressBlock label="Subtarefas concluídas" value={subtaskProgress} detail={`${completedSubtasks}/${subtasks.length || 0}`} />
            <ProgressBlock label="Plano do dia concluído" value={dayPlanProgress} detail={`${completedDayPlanItems}/${dayPlan.items.length || 0}`} />
          </section>

          <section className="grid gap-4 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
            <div>
              <p className="text-[0.68rem] font-extrabold uppercase tracking-[0.2em] text-slate-500">Leitura geral</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Combina estrutura concluída, itens do dia finalizados e meta temporal atingida.
              </p>
            </div>
            <div className="rounded-[1.35rem] border border-white/8 bg-slate-950/45 p-4">
              <p className="text-sm font-medium text-slate-200">Progresso combinado</p>
              <strong className="mt-3 block text-4xl font-semibold tracking-[-0.06em] text-white">
                {Math.round(overallProgress)}%
              </strong>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Esta leitura ainda é local e diária. Histórico expandido pode vir na próxima lapidação.
              </p>
              <div className="mt-4">
                <Progress value={overallProgress} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-sm">
              <SummaryChip label="Micro pausas" value={todayHistory.completedMicroPauses} />
              <SummaryChip label="Pausas longas" value={todayHistory.completedLongBreaks} />
              <SummaryChip label="Itens do dia" value={completedDayPlanItems} />
            </div>
          </section>
        </div>
      </CardContent>
    </Card>
  );
}

function MetricCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <section className="rounded-[1.35rem] border border-white/10 bg-white/[0.04] px-4 py-4">
      <p className="text-[0.68rem] font-extrabold uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <strong className="mt-3 block text-3xl font-semibold tracking-[-0.05em] text-white">{value}</strong>
      <p className="mt-2 text-sm text-slate-400">{detail}</p>
    </section>
  );
}

function ProgressBlock({ label, value, detail }: { label: string; value: number; detail: string }) {
  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-200">{label}</p>
        <span className="text-sm text-slate-400">{detail}</span>
      </div>
      <Progress value={value} />
    </div>
  );
}

function SummaryChip({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[1rem] border border-white/8 bg-slate-950/45 px-3 py-3 text-slate-200">
      <p className="text-[0.68rem] uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}
