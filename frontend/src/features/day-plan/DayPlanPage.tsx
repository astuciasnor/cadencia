import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { useAppStore } from "@/stores/app-store";

type PriorityValue = "A" | "M" | "B";

export function DayPlanPage() {
  const currentFocus = useAppStore((store) => store.state.currentFocus);
  const dayPlan = useAppStore((store) => store.state.dayPlan);
  const projects = useAppStore((store) => store.state.projects);
  const tasks = useAppStore((store) => store.state.tasks);
  const addStandaloneDayPlanItem = useAppStore((store) => store.addStandaloneDayPlanItem);
  const addLinkedDayPlanItem = useAppStore((store) => store.addLinkedDayPlanItem);
  const removeDayPlanItem = useAppStore((store) => store.removeDayPlanItem);
  const toggleDayPlanItemCompleted = useAppStore((store) => store.toggleDayPlanItemCompleted);
  const setDayPlanItemFocus = useAppStore((store) => store.setDayPlanItemFocus);

  const [standaloneTitle, setStandaloneTitle] = useState("");
  const [standalonePriority, setStandalonePriority] = useState<PriorityValue>("M");
  const [linkedSource, setLinkedSource] = useState("");
  const [linkedPriority, setLinkedPriority] = useState<PriorityValue>("M");

  const linkedOptions = useMemo(
    () =>
      tasks.flatMap((task) => {
        const project = projects.find((project) => project.id === task.projectId);
        const taskOption = {
          value: `task:${task.id}`,
          label: `${project?.title ?? "Sem projeto"} · ${task.title}`
        };

        const subtaskOptions = task.subtasks.map((subtask) => ({
          value: `subtask:${task.id}:${subtask.id}`,
          label: `${project?.title ?? "Sem projeto"} · ${task.title} · ${subtask.title}`
        }));

        return [taskOption, ...subtaskOptions];
      }),
    [projects, tasks]
  );

  function isFocused(itemId: string, kind: "standalone" | "task" | "subtask", taskId?: string, subtaskId?: string) {
    if (!currentFocus) {
      return false;
    }

    if (kind === "standalone") {
      return currentFocus.kind === "standalone" && currentFocus.dayPlanItemId === itemId;
    }

    if (kind === "task") {
      return currentFocus.kind === "task" && currentFocus.sourceTaskId === taskId;
    }

    return currentFocus.kind === "subtask" && currentFocus.sourceTaskId === taskId && currentFocus.sourceSubtaskId === subtaskId;
  }

  return (
    <Card>
      <CardContent className="grid gap-4 p-5">
        <PageHeader
          eyebrow="Plano do dia"
          title="Seleção operacional do que entra hoje"
          description="Aqui entram itens avulsos e itens ligados à estrutura. A lista abaixo é o recorte prático do dia."
          actions={
            <div className="flex flex-wrap gap-2">
              <Badge variant="muted">{dayPlan.items.length} itens</Badge>
              <Badge variant="muted">
                {dayPlan.items.filter((item) => item.completed).length} concluídos
              </Badge>
            </div>
          }
        />

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr),minmax(0,1fr)]">
          <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
            <p className="text-[0.68rem] font-extrabold uppercase tracking-[0.2em] text-slate-500">Item avulso</p>
            <div className="mt-3 grid gap-3 md:grid-cols-[minmax(0,1fr),88px,auto]">
              <Input
                value={standaloneTitle}
                onChange={(event) => setStandaloneTitle(event.target.value)}
                placeholder="Ex.: revisar parecer antes da reunião"
              />
              <Select
                value={standalonePriority}
                onChange={(event) => setStandalonePriority(event.target.value as PriorityValue)}
              >
                <option value="A">A</option>
                <option value="M">M</option>
                <option value="B">B</option>
              </Select>
              <Button
                onClick={() => {
                  if (!standaloneTitle.trim()) {
                    return;
                  }

                  addStandaloneDayPlanItem(standaloneTitle, standalonePriority);
                  setStandaloneTitle("");
                }}
              >
                Adicionar
              </Button>
            </div>
          </section>

          <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
            <p className="text-[0.68rem] font-extrabold uppercase tracking-[0.2em] text-slate-500">Item vinculado</p>
            <div className="mt-3 grid gap-3 md:grid-cols-[minmax(0,1fr),88px,auto]">
              <Select value={linkedSource} onChange={(event) => setLinkedSource(event.target.value)}>
                <option value="">Selecione uma tarefa ou subtarefa</option>
                {linkedOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
              <Select
                value={linkedPriority}
                onChange={(event) => setLinkedPriority(event.target.value as PriorityValue)}
              >
                <option value="A">A</option>
                <option value="M">M</option>
                <option value="B">B</option>
              </Select>
              <Button
                onClick={() => {
                  if (!linkedSource) {
                    return;
                  }

                  addLinkedDayPlanItem(linkedSource, linkedPriority);
                  setLinkedSource("");
                }}
              >
                Vincular
              </Button>
            </div>
          </section>
        </div>

        <div className="grid gap-3">
          {dayPlan.items.length === 0 ? (
            <div className="rounded-[1.5rem] border border-dashed border-white/10 bg-white/[0.03] px-4 py-4 text-sm leading-6 text-slate-400">
              Nenhum item no plano do dia ainda. Use a estrutura de Projetos ou adicione um item avulso.
            </div>
          ) : (
            dayPlan.items.map((item) => (
              <article
                key={item.id}
                className="grid gap-3 rounded-[1.35rem] border border-white/10 bg-white/[0.04] px-4 py-4 md:grid-cols-[minmax(0,1fr),auto]"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold text-white">{item.title}</h3>
                    <Badge variant={item.priority === "A" ? "amber" : item.priority === "M" ? "blue" : "muted"}>
                      Prioridade {item.priority}
                    </Badge>
                    {item.completed ? <Badge variant="success">Concluído</Badge> : null}
                    {isFocused(
                      item.id,
                      item.kind,
                      "sourceTaskId" in item ? item.sourceTaskId : undefined,
                      "sourceSubtaskId" in item ? item.sourceSubtaskId ?? undefined : undefined
                    ) ? (
                      <Badge variant="success">Foco atual</Badge>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    {item.kind === "standalone"
                      ? "Item avulso do dia"
                      : item.kind === "task"
                        ? "Ligado a uma tarefa estrutural"
                        : "Ligado a uma subtarefa estrutural"}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setDayPlanItemFocus(item.id)}>
                    Definir foco
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => toggleDayPlanItemCompleted(item.id)}>
                    {item.completed ? "Reabrir" : "Concluir"}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => removeDayPlanItem(item.id)}>
                    Remover
                  </Button>
                </div>
              </article>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
