# Cadência V2 — Modelo de Store

## Finalidade deste documento
Este documento define como o estado da aplicação deve ser organizado na V2 do Cadência.

Seu objetivo é:
- orientar a implementação da store;
- separar estado persistente de estado efêmero;
- evitar acoplamento excessivo entre UI e domínio;
- estabelecer a fonte de verdade do sistema;
- preparar o app para crescer de forma previsível.

Este documento complementa o `MODEL_V2.md`.

---

## Princípios da store
- a store deve refletir o domínio, não a interface antiga;
- o `foco atual` é uma entidade central;
- o estado persistente deve ser claro, previsível e serializável;
- estado de UI efêmero deve ser separado do estado de negócio;
- mutações devem ser explícitas e seguras;
- persistência local é prioridade na V2 inicial;
- a store não deve virar depósito de hacks visuais.

---

## Divisão de estado
A store da V2 deve ser dividida em duas camadas principais.

### 1. Estado persistente
Representa o estado de negócio que precisa sobreviver entre sessões.

Exemplos:
- projetos
- tarefas
- subtarefas
- foco atual
- registros de ritmo
- registros de execução
- plano do dia
- progresso diário
- sessão do timer

### 2. Estado efêmero de UI
Representa estado temporário da interface.

Exemplos:
- aba ativa
- projeto selecionado
- sub-aba ativa do Plano do dia
- dialogs abertos
- drafts temporários de formulário
- item expandido visualmente

---

## Estrutura geral da store

## PersistentState
Representa o estado persistente principal da aplicação.

```ts
type PersistentState = {
  projects: Project[]
  tasks: Task[]
  subtasks: Subtask[]
  focus: FocusTarget | null
  rhythmRecords: RhythmRecord[]
  executionRecords: ExecutionRecord[]
  dayPlanItems: DayPlanItem[]
  dailyProgress: DailyProgress[]
  timerSession: TimerSession
}
```

### Observações
- este shape representa a direção normativa da store;
- ele deve ser serializável sem dependência de componentes;
- ele não deve conter estado efêmero de interface.

---

## UIState
Representa o estado efêmero da interface.

```ts
type UIState = {
  activeTab: "timer" | "projects" | "day-plan" | "rhythm" | "progress"
  selectedProjectId?: string | null
  selectedDayPlanView?: "select" | "table"
  openDialog?: string | null
  expandedItemIds?: string[]
}
```

### Observações
- `UIState` não é a fonte de verdade do produto;
- ele pode ser descartado e reconstruído sem perda do estado de negócio;
- ele não deve carregar regra de domínio.

---

## Estrutura recomendada da store

```ts
type AppStore = {
  persistent: PersistentState
  ui: UIState

  hydrate: () => void
  resetPersistentState: () => void

  setActiveTab: (tab: UIState["activeTab"]) => void
  setSelectedProject: (projectId: string | null) => void
  setDayPlanView: (view: "select" | "table") => void

  addProject: (input: AddProjectInput) => void
  updateProject: (projectId: string, input: UpdateProjectInput) => void
  removeProject: (projectId: string) => void

  addTask: (input: AddTaskInput) => void
  updateTask: (taskId: string, input: UpdateTaskInput) => void
  removeTask: (taskId: string) => void
  moveTaskToProject: (taskId: string, projectId: string) => void

  addSubtask: (input: AddSubtaskInput) => void
  updateSubtask: (subtaskId: string, input: UpdateSubtaskInput) => void
  removeSubtask: (subtaskId: string) => void

  setFocus: (target: FocusTarget | null) => void

  upsertRhythmRecord: (record: RhythmRecord) => void
  upsertExecutionRecord: (record: ExecutionRecord) => void

  addDayPlanItem: (input: AddDayPlanItemInput) => void
  updateDayPlanItem: (itemId: string, input: UpdateDayPlanItemInput) => void
  removeDayPlanItem: (itemId: string) => void

  startTimer: () => void
  pauseTimer: () => void
  resetTimer: () => void
  tickTimer: () => void

  markTaskCompleted: (taskId: string, completed: boolean) => void
  markSubtaskCompleted: (subtaskId: string, completed: boolean) => void
}
```

### Intenção
- `persistent` concentra a verdade do produto;
- `ui` concentra navegação e estado visual temporário;
- as mutações devem expor nomes claros e previsíveis;
- o componente não deve escrever no storage diretamente.

---

## Fonte de verdade do sistema

### Projetos, tarefas e subtarefas
A fonte de verdade da estrutura do trabalho deve estar no estado persistente.

### Foco atual
A fonte de verdade do foco deve ser única.
Todas as telas dependentes de foco devem ler dessa mesma entidade.

### Ritmo e execução
Devem ser persistidos como registros vinculados ao item em foco, e não como estado local da tela.

### Plano do dia
Deve referenciar a estrutura existente ou item avulso do dia.
Não deve duplicar permanentemente tarefas do sistema.

### Timer
Deve depender do foco atual e da sessão temporal persistida.
Não deve se tornar fonte de verdade da estrutura do trabalho.

---

## Persistência local

### Primeira etapa da V2
A persistência inicial deve usar `localStorage`.

### Regras
- a serialização deve usar apenas estado persistente;
- o adapter de persistência deve ficar fora dos componentes;
- hidratação deve normalizar e validar o shape carregado;
- falhas de leitura não devem quebrar a aplicação;
- a store deve poder migrar para outro backend de persistência no futuro.

### Adapter recomendado

```ts
interface PersistentStateAdapter {
  load(): PersistentState
  save(state: PersistentState): PersistentState
  reset(): PersistentState
}
```

---

## Regras de mutação
- mutações devem ser explícitas;
- cada mutação deve alterar apenas o necessário;
- regras de domínio devem preferencialmente morar em helpers puros;
- a store deve orquestrar aplicação da regra e persistência;
- mutações de UI não devem alterar domínio sem intenção explícita.

---

## Regras de integridade na store
- toda `Task` deve possuir `projectId` válido;
- toda `Subtask` deve possuir `taskId` válido;
- só pode existir um foco atual por vez;
- `Sem projeto` nunca deve desaparecer sem estratégia explícita;
- remoção de projeto deve tratar suas tarefas de forma segura;
- timer deve sempre operar sobre estado consistente;
- progresso diário deve refletir uso real do sistema.

---

## Hidratação

### Objetivo
Reconstruir o estado persistente de forma segura ao iniciar a aplicação.

### Regras
- partir de um estado padrão válido;
- carregar do storage;
- normalizar campos ausentes ou inválidos;
- garantir invariantes estruturais;
- só depois expor o estado como hidratado.

### Sinal de hidratação
A store pode manter um campo efêmero como:

```ts
type UIState = {
  isHydrated: boolean
  activeTab: "timer" | "projects" | "day-plan" | "rhythm" | "progress"
}
```

---

## Organização recomendada da implementação

### Camadas
- `src/domain/`: tipos e regras puras
- `src/adapters/`: persistência
- `src/stores/`: store e actions
- `src/features/`: uso da store pelas telas

### Regra prática
Se uma regra puder existir sem React, ela deve preferencialmente morar fora da store.

---

## O que este modelo evita
- store misturada com comportamento visual improvisado;
- componentes escrevendo diretamente no `localStorage`;
- foco calculado de formas diferentes em telas diferentes;
- duplicação estrutural no Plano do dia;
- crescimento da aplicação sem fonte de verdade clara.

---

## Compatibilidade com a implementação atual
Em 09/03/2026, a base já possui store funcional com `Zustand` e persistência local, mas ainda não segue este modelo de forma literal.

### Diferenças principais hoje
- o estado persistido atual está em `state`, não em `persistent`;
- `Task` ainda contém `subtasks` embutidas;
- foco, execução, plano do dia e progresso usam shapes próprios da implementação atual;
- a store atual centraliza muitas mutations em um único arquivo;
- o timer persiste em `localStorage` a cada `tick`.

### Leitura correta
- este documento define a organização alvo da store;
- a implementação atual é funcional, mas ainda é uma etapa intermediária;
- qualquer convergência deve preservar compatibilidade de hidratação e dados existentes.

---

## Próximo passo recomendado
Usar este documento para guiar uma convergência gradual entre:
- o modelo normativo de `MODEL_V2.md`
- a store já implementada em `src/stores/app-store.ts`

Antes de refatorar:
- mapear diferenças de shape;
- definir estratégia de migração;
- preservar a V2 já funcional.
