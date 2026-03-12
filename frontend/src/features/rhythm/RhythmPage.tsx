import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createDefaultExecutionEntry } from "@/domain/execution";
import { getFocusKey } from "@/domain/focus";
import { useAppStore } from "@/stores/app-store";

function toScaleValue(value: string): 1 | 2 | 3 | 4 | 5 | null {
  if (value === "") {
    return null;
  }

  const numeric = Number(value);
  return numeric === 1 || numeric === 2 || numeric === 3 || numeric === 4 || numeric === 5 ? numeric : null;
}

export function RhythmPage() {
  const currentFocus = useAppStore((store) => store.state.currentFocus);
  const tasks = useAppStore((store) => store.state.tasks);
  const execution = useAppStore((store) => store.state.execution);
  const updateFocusedWork = useAppStore((store) => store.updateFocusedWork);
  const updateFocusedExecution = useAppStore((store) => store.updateFocusedExecution);

  const [workForm, setWorkForm] = useState({
    title: "",
    minutes: "15",
    nextStepNote: "",
    startEase: "",
    anxietyLevel: "",
    perceivedLoad: ""
  });
  const [executionForm, setExecutionForm] = useState({
    mode: "solo" as "solo" | "meeting",
    materials: "",
    actions: "",
    contacts: "",
    phones: "",
    notes: "",
    instructions: ""
  });

  const focusedTask = currentFocus
    ? tasks.find((task) => task.id === currentFocus.taskId) ?? null
    : null;
  const focusedSubtask = currentFocus?.kind === "subtask" && focusedTask
    ? focusedTask.subtasks.find((subtask) => subtask.id === currentFocus.subtaskId) ?? null
    : null;
  const executionEntry = currentFocus
    ? execution[getFocusKey(currentFocus)] ?? createDefaultExecutionEntry()
    : createDefaultExecutionEntry();

  useEffect(() => {
    if (!currentFocus || !focusedTask) {
      setWorkForm({
        title: "",
        minutes: "15",
        nextStepNote: "",
        startEase: "",
        anxietyLevel: "",
        perceivedLoad: ""
      });
      setExecutionForm({
        mode: "solo",
        materials: "",
        actions: "",
        contacts: "",
        phones: "",
        notes: "",
        instructions: ""
      });
      return;
    }

    const target = focusedSubtask ?? focusedTask;
    setWorkForm({
      title: target.title,
      minutes: focusedSubtask ? String(focusedSubtask.minutes) : "15",
      nextStepNote: target.nextStepNote,
      startEase: target.cognitiveProfile.startEase ? String(target.cognitiveProfile.startEase) : "",
      anxietyLevel: target.cognitiveProfile.anxietyLevel ? String(target.cognitiveProfile.anxietyLevel) : "",
      perceivedLoad: target.cognitiveProfile.perceivedLoad ? String(target.cognitiveProfile.perceivedLoad) : ""
    });
    setExecutionForm({
      mode: executionEntry.mode,
      materials: executionEntry.materials,
      actions: executionEntry.actions.join("\n"),
      contacts: executionEntry.contacts,
      phones: executionEntry.phones,
      notes: executionEntry.notes,
      instructions: executionEntry.instructions
    });
  }, [currentFocus, executionEntry, focusedSubtask, focusedTask]);

  if (!currentFocus || !focusedTask) {
    return (
      <Card>
        <CardContent className="grid gap-4 p-5">
          <PageHeader
            eyebrow="Ritmo"
            title="Nenhum foco atual definido"
            description="Defina o foco em Projetos para editar próximo passo, carga cognitiva e moldura prática de execução."
          />
        </CardContent>
      </Card>
    );
  }

  if (currentFocus.kind === "standalone") {
    return (
      <Card>
        <CardContent className="grid gap-4 p-5">
          <PageHeader
            eyebrow="Ritmo"
            title="Foco avulso identificado"
            description="O suporte completo a foco vindo do Plano do dia entra junto com a etapa dessa feature."
          />
        </CardContent>
      </Card>
    );
  }

  const targetLabel = currentFocus.kind === "subtask" && focusedSubtask ? focusedSubtask.title : focusedTask.title;

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr),minmax(0,1fr)]">
      <Card>
        <CardContent className="grid gap-4 p-5">
          <PageHeader
            eyebrow="Ritmo"
            title="Leitura cognitiva do foco atual"
            description="Clarifica o que fazer agora e reduz a fricção de início."
            actions={
              <div className="flex flex-wrap gap-2">
                <Badge variant="blue">{currentFocus.kind === "subtask" ? "Subtarefa" : "Tarefa"}</Badge>
                <Badge variant="muted">{targetLabel}</Badge>
              </div>
            }
          />

          <div className="grid gap-4 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr),120px]">
              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-200">Título em foco</label>
                <Input
                  value={workForm.title}
                  onChange={(event) => setWorkForm((current) => ({ ...current, title: event.target.value }))}
                />
              </div>

              {currentFocus.kind === "subtask" ? (
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-slate-200">Minutos</label>
                  <Input
                    type="number"
                    min={1}
                    max={240}
                    value={workForm.minutes}
                    onChange={(event) => setWorkForm((current) => ({ ...current, minutes: event.target.value }))}
                  />
                </div>
              ) : null}
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-200">Próximo passo</label>
              <Textarea
                value={workForm.nextStepNote}
                onChange={(event) => setWorkForm((current) => ({ ...current, nextStepNote: event.target.value }))}
                placeholder="Descreva a ação imediatamente executável."
              />
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-200">Facilidade de início</label>
                <Select
                  value={workForm.startEase}
                  onChange={(event) => setWorkForm((current) => ({ ...current, startEase: event.target.value }))}
                >
                  <option value="">Sem valor</option>
                  {[1, 2, 3, 4, 5].map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-200">Ansiedade associada</label>
                <Select
                  value={workForm.anxietyLevel}
                  onChange={(event) => setWorkForm((current) => ({ ...current, anxietyLevel: event.target.value }))}
                >
                  <option value="">Sem valor</option>
                  {[1, 2, 3, 4, 5].map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-200">Carga percebida</label>
                <Select
                  value={workForm.perceivedLoad}
                  onChange={(event) =>
                    setWorkForm((current) => ({ ...current, perceivedLoad: event.target.value }))
                  }
                >
                  <option value="">Sem valor</option>
                  {[1, 2, 3, 4, 5].map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={() =>
                  updateFocusedWork({
                    title: workForm.title,
                    minutes: currentFocus.kind === "subtask" ? Number(workForm.minutes || 15) : undefined,
                    nextStepNote: workForm.nextStepNote,
                    startEase: toScaleValue(workForm.startEase),
                    anxietyLevel: toScaleValue(workForm.anxietyLevel),
                    perceivedLoad: toScaleValue(workForm.perceivedLoad)
                  })
                }
              >
                Salvar ritmo
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid gap-4 p-5">
          <PageHeader
            eyebrow="Execução"
            title="Moldura prática do mesmo foco"
            description="Concentra o necessário para executar sem ruído: materiais, contatos, ações e instruções."
          />

          <div className="grid gap-4 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-200">Modo</label>
                <Select
                  value={executionForm.mode}
                  onChange={(event) =>
                    setExecutionForm((current) => ({ ...current, mode: event.target.value as "solo" | "meeting" }))
                  }
                >
                  <option value="solo">Solo</option>
                  <option value="meeting">Reunião</option>
                </Select>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-200">Materiais</label>
                <Input
                  value={executionForm.materials}
                  onChange={(event) =>
                    setExecutionForm((current) => ({ ...current, materials: event.target.value }))
                  }
                />
              </div>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-200">Ações</label>
              <Textarea
                value={executionForm.actions}
                onChange={(event) => setExecutionForm((current) => ({ ...current, actions: event.target.value }))}
                placeholder="Uma ação por linha."
              />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-200">Contatos</label>
                <Input
                  value={executionForm.contacts}
                  onChange={(event) =>
                    setExecutionForm((current) => ({ ...current, contacts: event.target.value }))
                  }
                />
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-200">Telefones</label>
                <Input
                  value={executionForm.phones}
                  onChange={(event) => setExecutionForm((current) => ({ ...current, phones: event.target.value }))}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-200">Notas</label>
              <Textarea
                value={executionForm.notes}
                onChange={(event) => setExecutionForm((current) => ({ ...current, notes: event.target.value }))}
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-200">Instruções práticas</label>
              <Textarea
                value={executionForm.instructions}
                onChange={(event) =>
                  setExecutionForm((current) => ({ ...current, instructions: event.target.value }))
                }
              />
            </div>

            <div className="flex justify-end">
              <Button
                onClick={() =>
                  updateFocusedExecution({
                    mode: executionForm.mode,
                    materials: executionForm.materials.trim(),
                    actions: executionForm.actions
                      .split("\n")
                      .map((entry) => entry.trim())
                      .filter(Boolean),
                    contacts: executionForm.contacts.trim(),
                    phones: executionForm.phones.trim(),
                    notes: executionForm.notes.trim(),
                    instructions: executionForm.instructions.trim()
                  })
                }
              >
                Salvar execução
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
