import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { PROVISIONAL_PROJECT_ID, PROJECT_COLOR_PALETTE } from "@/domain/constants";
import type { Project, Task } from "@/domain/types";
import type { SelectedProjectNode } from "./ProjectsTree";

interface ProjectsInspectorPanelProps {
  projects: Project[];
  tasks: Task[];
  selectedNode: SelectedProjectNode | null;
  selectedProject: Project | null;
  selectedTask: Task | null;
  selectedSubtask: Task["subtasks"][number] | null;
  projectMode: "view" | "create";
  projectForm: { title: string; color: string };
  taskForm: { title: string; projectId: string };
  subtaskForm: { title: string; minutes: string; taskId: string };
  taskDraft: string;
  subtaskDraft: { title: string; minutes: string };
  onProjectFormChange: (field: "title" | "color", value: string) => void;
  onTaskFormChange: (field: "title" | "projectId", value: string) => void;
  onSubtaskFormChange: (field: "title" | "minutes" | "taskId", value: string) => void;
  onTaskDraftChange: (value: string) => void;
  onSubtaskDraftChange: (field: "title" | "minutes", value: string) => void;
  onCreateProject: () => void;
  onSaveProject: () => void;
  onRemoveProject: () => void;
  onAddTask: () => void;
  onSaveTask: () => void;
  onRemoveTask: () => void;
  onToggleTaskCompleted: () => void;
  onFocusTask: () => void;
  onOpenTaskRhythm: () => void;
  onAddSubtask: () => void;
  onSaveSubtask: () => void;
  onRemoveSubtask: () => void;
  onToggleSubtaskCompleted: () => void;
  onFocusSubtask: () => void;
  onOpenSubtaskRhythm: () => void;
}

export function ProjectsInspectorPanel({
  projects,
  tasks,
  selectedNode,
  selectedProject,
  selectedTask,
  selectedSubtask,
  projectMode,
  projectForm,
  taskForm,
  subtaskForm,
  taskDraft,
  subtaskDraft,
  onProjectFormChange,
  onTaskFormChange,
  onSubtaskFormChange,
  onTaskDraftChange,
  onSubtaskDraftChange,
  onCreateProject,
  onSaveProject,
  onRemoveProject,
  onAddTask,
  onSaveTask,
  onRemoveTask,
  onToggleTaskCompleted,
  onFocusTask,
  onOpenTaskRhythm,
  onAddSubtask,
  onSaveSubtask,
  onRemoveSubtask,
  onToggleSubtaskCompleted,
  onFocusSubtask,
  onOpenSubtaskRhythm
}: ProjectsInspectorPanelProps) {
  return (
    <aside className="grid gap-4 lg:sticky lg:top-[5.4rem] lg:self-start">
      <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
        <p className="text-[0.68rem] font-extrabold uppercase tracking-[0.2em] text-slate-500">Painel contextual</p>

        {projectMode === "create" ? (
          <div className="mt-3 grid gap-3">
            <div className="flex flex-wrap gap-2">
              <Badge variant="blue">Novo projeto</Badge>
            </div>
            <Input
              value={projectForm.title}
              onChange={(event) => onProjectFormChange("title", event.target.value)}
              placeholder="Nome do projeto"
            />
            <Select value={projectForm.color} onChange={(event) => onProjectFormChange("color", event.target.value)}>
              {PROJECT_COLOR_PALETTE.map((color) => (
                <option key={color} value={color}>
                  {color}
                </option>
              ))}
            </Select>
            <Button size="sm" onClick={onCreateProject}>
              Criar projeto
            </Button>
          </div>
        ) : null}

        {projectMode === "view" && selectedNode?.kind === "project" && selectedProject ? (
          <div className="mt-3 grid gap-3">
            <div className="flex flex-wrap gap-2">
              <Badge variant="blue">Projeto</Badge>
              {selectedProject.id === PROVISIONAL_PROJECT_ID ? <Badge variant="muted">Protegido</Badge> : null}
            </div>
            <MetricGrid
              items={[
                { label: "Status", value: "Estrutura" },
                { label: "Tarefas", value: String(tasks.filter((task) => task.projectId === selectedProject.id).length) },
                {
                  label: "Subtarefas",
                  value: String(tasks.filter((task) => task.projectId === selectedProject.id).reduce((total, task) => total + task.subtasks.length, 0))
                }
              ]}
            />
            <Input
              value={projectForm.title}
              onChange={(event) => onProjectFormChange("title", event.target.value)}
              placeholder="Nome do projeto"
            />
            <Select value={projectForm.color} onChange={(event) => onProjectFormChange("color", event.target.value)}>
              {PROJECT_COLOR_PALETTE.map((color) => (
                <option key={color} value={color}>
                  {color}
                </option>
              ))}
            </Select>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={onSaveProject}>
                Editar
              </Button>
              {selectedProject.id !== PROVISIONAL_PROJECT_ID ? (
                <Button variant="ghost" size="sm" onClick={onRemoveProject}>
                  Excluir
                </Button>
              ) : null}
            </div>

            <div className="mt-2 grid gap-3 rounded-[1.15rem] border border-white/10 bg-slate-950/42 p-3">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Adicionar tarefa</p>
              <Input
                value={taskDraft}
                onChange={(event) => onTaskDraftChange(event.target.value)}
                placeholder="Nova tarefa"
              />
              <Button size="sm" onClick={onAddTask}>
                Adicionar tarefa
              </Button>
            </div>
          </div>
        ) : null}

        {selectedNode?.kind === "task" && selectedTask && selectedProject ? (
          <div className="mt-3 grid gap-3">
            <div className="flex flex-wrap gap-2">
              <Badge variant="blue">Tarefa</Badge>
              <Badge variant="muted">{selectedProject.title}</Badge>
            </div>
            <MetricGrid
              items={[
                { label: "Status", value: selectedTask.completed ? "Concluída" : "Ativa" },
                {
                  label: "Progresso",
                  value: `${selectedTask.subtasks.filter((subtask) => subtask.completed).length}/${selectedTask.subtasks.length}`
                },
                { label: "Projeto", value: selectedProject.title }
              ]}
            />
            <Input
              value={taskForm.title}
              onChange={(event) => onTaskFormChange("title", event.target.value)}
              placeholder="Título da tarefa"
            />
            <Select value={taskForm.projectId} onChange={(event) => onTaskFormChange("projectId", event.target.value)}>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.title}
                </option>
              ))}
            </Select>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={onFocusTask}>
                Definir foco
              </Button>
              <Button variant="ghost" size="sm" onClick={onOpenTaskRhythm}>
                Abrir Ritmo
              </Button>
              <Button variant="ghost" size="sm" onClick={onSaveTask}>
                Editar / mover
              </Button>
              <Button variant="ghost" size="sm" onClick={onToggleTaskCompleted}>
                {selectedTask.completed ? "Reabrir" : "Concluir"}
              </Button>
              <Button variant="ghost" size="sm" onClick={onRemoveTask}>
                Excluir
              </Button>
            </div>

            <div className="mt-2 grid gap-3 rounded-[1.15rem] border border-white/10 bg-slate-950/42 p-3">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Adicionar subtarefa</p>
              <Input
                value={subtaskDraft.title}
                onChange={(event) => onSubtaskDraftChange("title", event.target.value)}
                placeholder="Nova subtarefa"
              />
              <Input
                type="number"
                min={1}
                max={240}
                value={subtaskDraft.minutes}
                onChange={(event) => onSubtaskDraftChange("minutes", event.target.value)}
              />
              <Button size="sm" onClick={onAddSubtask}>
                Adicionar subtarefa
              </Button>
            </div>
          </div>
        ) : null}

        {selectedNode?.kind === "subtask" && selectedTask && selectedSubtask && selectedProject ? (
          <div className="mt-3 grid gap-3">
            <div className="flex flex-wrap gap-2">
              <Badge variant="blue">Subtarefa</Badge>
              <Badge variant="muted">{selectedProject.title}</Badge>
            </div>
            <MetricGrid
              items={[
                { label: "Status", value: selectedSubtask.completed ? "Concluída" : "Ativa" },
                { label: "Tempo", value: `${selectedSubtask.minutes} min` },
                { label: "Origem", value: selectedTask.title }
              ]}
            />
            <Input
              value={subtaskForm.title}
              onChange={(event) => onSubtaskFormChange("title", event.target.value)}
              placeholder="Título da subtarefa"
            />
            <Input
              type="number"
              min={1}
              max={240}
              value={subtaskForm.minutes}
              onChange={(event) => onSubtaskFormChange("minutes", event.target.value)}
            />
            <Select value={subtaskForm.taskId} onChange={(event) => onSubtaskFormChange("taskId", event.target.value)}>
              {tasks.map((task) => (
                <option key={task.id} value={task.id}>
                  {task.title}
                </option>
              ))}
            </Select>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={onFocusSubtask}>
                Definir foco
              </Button>
              <Button variant="ghost" size="sm" onClick={onOpenSubtaskRhythm}>
                Abrir Ritmo
              </Button>
              <Button variant="ghost" size="sm" onClick={onSaveSubtask}>
                Editar / mover
              </Button>
              <Button variant="ghost" size="sm" onClick={onToggleSubtaskCompleted}>
                {selectedSubtask.completed ? "Reabrir" : "Concluir"}
              </Button>
              <Button variant="ghost" size="sm" onClick={onRemoveSubtask}>
                Excluir
              </Button>
            </div>
          </div>
        ) : null}

        {!selectedNode && projectMode !== "create" ? (
          <div className="mt-3 text-sm leading-6 text-slate-400">
            Selecione um item da árvore para ver status, progresso e ações.
          </div>
        ) : null}
      </section>
    </aside>
  );
}

function MetricGrid({ items }: { items: Array<{ label: string; value: string }> }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {items.map((item) => (
        <div key={item.label} className="rounded-[1rem] border border-white/8 bg-slate-950/45 px-3 py-3">
          <p className="text-[0.62rem] uppercase tracking-[0.16em] text-slate-500">{item.label}</p>
          <p className="mt-2 text-sm font-semibold text-white">{item.value}</p>
        </div>
      ))}
    </div>
  );
}
