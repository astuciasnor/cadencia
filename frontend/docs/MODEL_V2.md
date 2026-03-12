# Cadência V2 — Modelo de Domínio

## Finalidade
Este documento define o modelo de domínio base da V2.

Seu objetivo é:
- estabilizar os conceitos centrais do produto;
- orientar store, persistência local e features;
- evitar ambiguidades na implementação;
- separar claramente domínio de interface.

---

## Nota de compatibilidade com o código atual
Em 09/03/2026, a base implementada da V2 já possui domínio, store e persistência funcionais, mas ainda não segue este modelo de forma literal.

### Diferenças principais hoje
- `Task` ainda contém `subtasks: Subtask[]` embutidas;
- apoio cognitivo ainda está embutido em `Task` e `Subtask`;
- execução ainda está persistida como mapa indexado por chave de foco;
- `currentFocus` atual carrega mais contexto derivado do que o `FocusTarget` proposto aqui;
- progresso diário atual é salvo como histórico indexado por data.

Este documento deve ser tratado como referência normativa de arquitetura.

---

## Princípios do domínio
- o foco atual é uma entidade central do sistema;
- `Projeto > Tarefa > Subtarefa` é a estrutura principal do trabalho;
- o plano do dia é uma seleção operacional, não uma estrutura paralela;
- `Ritmo` e `Execução` pertencem ao item em foco;
- o app deve apoiar execução real, não apenas contagem de tempo;
- o domínio deve contemplar:
  - facilidade de início
  - ansiedade associada
  - carga percebida

---

## Entidades centrais

### Project
Campos:
- `id: string`
- `name: string`
- `color: string`
- `description?: string`
- `archived?: boolean`
- `createdAt: string`
- `updatedAt: string`

Observações:
- toda tarefa deve apontar para `projectId`;
- deve existir o projeto provisório `Sem projeto`.

### Task
Campos:
- `id: string`
- `projectId: string`
- `title: string`
- `description?: string`
- `completed: boolean`
- `order?: number`
- `createdAt: string`
- `updatedAt: string`

### Subtask
Campos:
- `id: string`
- `taskId: string`
- `title: string`
- `description?: string`
- `completed: boolean`
- `estimatedMinutes?: number`
- `order?: number`
- `createdAt: string`
- `updatedAt: string`

Observações:
- subtarefa é a melhor candidata para foco no timer;
- o sistema deve permitir foco em tarefa ou subtarefa, mas privilegiar subtarefa quando houver.

---

## Entidades de apoio ao foco

### FocusTarget
Campos:
- `type: "task" | "subtask"`
- `id: string`
- `source: "projects" | "day-plan" | "manual"`
- `setAt: string`

Regras:
- existe apenas um foco atual por vez;
- timer e ritmo devem refletir essa entidade.

### RhythmRecord
Campos:
- `itemType: "task" | "subtask"`
- `itemId: string`
- `startEase: "low" | "medium" | "high" | null`
- `anxietyLevel: "low" | "medium" | "high" | null`
- `perceivedLoad: "within-capacity" | "near-limit" | "above-capacity" | null`
- `nextStep?: string`
- `notes?: string`
- `updatedAt: string`

### ExecutionRecord
Campos:
- `itemType: "task" | "subtask"`
- `itemId: string`
- `mode?: string`
- `materials?: string`
- `actions?: string`
- `contacts?: string`
- `notes?: string`
- `updatedAt: string`

Observação:
- `ExecutionRecord` faz parte da superfície de `Ritmo`, não de uma aba própria.

---

## Entidades operacionais

### DayPlanItem
Campos:
- `id: string`
- `sourceType: "project" | "inbox"`
- `taskId?: string`
- `subtaskId?: string`
- `projectId?: string`
- `title: string`
- `priority: "A" | "M" | "B"`
- `executionSummary?: string`
- `done: boolean`
- `createdAt: string`

Regras:
- pode apontar para tarefa ou subtarefa;
- itens avulsos não precisam de projeto;
- plano do dia não substitui a estrutura.

### DailyProgress
Campos:
- `dateKey: string`
- `focusSessionsCompleted: number`
- `focusedMinutes: number`
- `completedTasks: number`
- `completedSubtasks: number`

---

## Entidade temporal

### TimerSession
Campos:
- `phase: "focus" | "short-break" | "long-break"`
- `running: boolean`
- `remainingSeconds: number`
- `focusDurationSeconds: number`
- `shortBreakSeconds: number`
- `longBreakSeconds: number`
- `cyclesCompleted: number`
- `startedAt?: string`
- `updatedAt: string`

---

## Estrutura agregada sugerida

### AppState
- `projects: Project[]`
- `tasks: Task[]`
- `subtasks: Subtask[]`
- `focus: FocusTarget | null`
- `rhythmRecords: RhythmRecord[]`
- `executionRecords: ExecutionRecord[]`
- `dayPlanItems: DayPlanItem[]`
- `dailyProgress: DailyProgress[]`
- `timerSession: TimerSession`
- `ui?: UIState`

### UIState
- `activeTab: "timer" | "projects" | "day-plan" | "rhythm" | "progress"`
- `selectedProjectId?: string | null`
- `selectedDayPlanView?: "select" | "table"`

Observação:
- `UIState` é efêmero e não precisa ser persistido integralmente.

---

## Regras de integridade
- toda `Task` deve possuir `projectId`;
- toda `Subtask` deve possuir `taskId` válido;
- só pode existir um `FocusTarget` por vez;
- `DayPlanItem` não deve duplicar estrutura permanente;
- `RhythmRecord` e `ExecutionRecord` se vinculam a `itemType + itemId`;
- progresso deve refletir uso real do sistema.

---

## Projeto provisório `Sem projeto`
Finalidade:
- evitar tarefas soltas fora da estrutura

Regra:
- se uma tarefa existir sem projeto real, ela deve ser movida para `Sem projeto`

---

## Convenções de implementação
- IDs devem ser strings estáveis
- datas devem usar string ISO
- `order` pode ser usado em `Task` e `Subtask`
- campos opcionais devem ser usados com moderação

---

## Próximo passo recomendado
Antes de refatorar o domínio implementado para aderência total a este modelo:
- mapear diferenças entre este documento e o shape atual persistido;
- definir estratégia de migração segura;
- preservar a V2 já funcional durante a convergência.
