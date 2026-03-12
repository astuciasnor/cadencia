import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import type { Project, Task } from "@/domain/types";

interface ProjectsToolbarProps {
  projects: Project[];
  currentProjectId: string;
  tasks: Task[];
  onProjectChange: (projectId: string) => void;
  onNewProject: () => void;
  onEditProject: () => void;
  onAddTask: () => void;
}

export function ProjectsToolbar({
  projects,
  currentProjectId,
  tasks,
  onProjectChange,
  onNewProject,
  onEditProject,
  onAddTask
}: ProjectsToolbarProps) {
  const subtasks = tasks.flatMap((task) => task.subtasks);
  const completedItems =
    tasks.filter((task) => task.completed).length +
    subtasks.filter((subtask) => subtask.completed).length;
  const totalItems = tasks.length + subtasks.length;

  return (
    <section className="rounded-[1.45rem] border border-white/10 bg-white/[0.04] px-4 py-3">
      <div className="grid gap-3 xl:grid-cols-[minmax(0,250px),auto,minmax(0,1fr)] xl:items-center">
        <Select value={currentProjectId} onChange={(event) => onProjectChange(event.target.value)} className="h-10">
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.title}
            </option>
          ))}
        </Select>

        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={onNewProject}>
            Novo projeto
          </Button>
          <Button variant="ghost" size="sm" onClick={onEditProject}>
            Editar projeto
          </Button>
          <Button variant="outline" size="sm" onClick={onAddTask}>
            Nova tarefa
          </Button>
        </div>

        <div className="flex flex-wrap gap-2 xl:justify-end">
          <Badge variant="muted">{tasks.length} tarefas</Badge>
          <Badge variant="muted">{subtasks.length} subtarefas</Badge>
          <Badge variant="muted">
            {completedItems}/{totalItems || 0} concluidas
          </Badge>
        </div>
      </div>
    </section>
  );
}
