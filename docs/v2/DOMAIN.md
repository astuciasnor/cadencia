# Cadência V2 — Modelo de Domínio

## Finalidade deste documento
Este documento define o modelo de domínio base da V2 do Cadência.

Seu objetivo é:
- estabilizar os conceitos centrais do produto;
- orientar store, persistência local e features;
- evitar ambiguidades na implementação;
- separar claramente domínio de interface.

A V2 deve tratar este documento como referência principal para modelagem de dados.

---

## Nota de compatibilidade com o código atual
Em 09/03/2026, a base implementada da V2 já possui domínio, store e persistência funcionais, mas ainda não segue este modelo de forma literal.

As principais diferenças atuais são:
- `Task` ainda contém `subtasks: Subtask[]` embutidas, em vez de `Subtask[]` separado no `AppState`;
- apoio cognitivo ainda está embutido em `Task` e `Subtask`, e não isolado em `RhythmRecord[]`;
- execução ainda está persistida como mapa indexado por chave de foco, e não como `ExecutionRecord[]`;
- `currentFocus` atual carrega mais contexto derivado do que o `FocusTarget` proposto aqui;
- progresso diário atual é salvo como histórico indexado por data, e não como `DailyProgress[]`.

Portanto:
- este documento define a direção normativa do domínio;
- qualquer refatoração do código para aderência total deve ser feita de forma explícita e segura;
- até essa convergência acontecer, ele deve ser lido como referência de arquitetura e não como descrição exata do shape persistido atual.

---

## Princípios do domínio
- o `foco atual` é uma entidade central do sistema;
- `Projeto > Tarefa > Subtarefa` é a estrutura principal do trabalho;
- o `Plano do dia` é uma seleção operacional, não uma estrutura paralela;
- `Ritmo` e `Execução` pertencem ao item atualmente em foco;
- o app deve apoiar execução real, não apenas contagem de tempo;
- o domínio deve contemplar apoio cognitivo:
  - facilidade de início
  - ansiedade associada
  - carga percebida

---

## Entidades centrais

### Project
Representa um contêiner principal de trabalho.

Exemplos:
- Preparar aula de Bioquímica
- Escrever artigo científico
- Projeto de pesquisa
- Relatório de projeto
- Orientação de alunos
- Colegiado
- Trabalho administrativo

#### Campos
- `id: string`
- `name: string`
- `color: string`
- `description?: string`
- `archived?: boolean`
- `createdAt: string`
- `updatedAt: string`

#### Observações
- todo projeto deve ter identidade própria;
- tarefas devem se vincular a projeto por `projectId`;
- deve existir um projeto provisório chamado `Sem projeto` quando necessário.

---

### Task
Representa uma unidade relevante dentro de um projeto.

#### Campos
- `id: string`
- `projectId: string`
- `title: string`
- `description?: string`
- `completed: boolean`
- `order?: number`
- `createdAt: string`
- `updatedAt: string`

#### Observações
- toda tarefa pertence a um projeto;
- a tarefa pode ter subtarefas;
- a tarefa pode existir sem subtarefa, mas ainda assim deve ser executável;
- se a tarefa não estiver associada a um projeto real, deve ir para `Sem projeto`.

---

### Subtask
Representa a unidade mais concreta de execução dentro de uma tarefa.

#### Campos
- `id: string`
- `taskId: string`
- `title: string`
- `description?: string`
- `completed: boolean`
- `estimatedMinutes?: number`
- `order?: number`
- `createdAt: string`
- `updatedAt: string`

#### Observações
- a subtarefa é a melhor candidata para virar item em foco no timer;
- subtarefas devem ser leves, concretas e executáveis;
- o sistema deve permitir foco em tarefa ou subtarefa, mas privilegiar subtarefa quando houver.

---

## Entidades de apoio ao foco

### FocusTarget
Representa o item atualmente em foco no sistema.

#### Campos
- `type: "task" | "subtask"`
- `id: string`
- `source: "projects" | "day-plan" | "manual"`
- `setAt: string`

#### Observações
- existe apenas um foco atual por vez;
- todas as telas que dependem do foco devem usar esta entidade;
- o timer deve sempre refletir o foco atual.

---

### RhythmRecord
Representa a leitura cognitiva e operacional do item em foco.

#### Campos
- `itemType: "task" | "subtask"`
- `itemId: string`
- `startEase: "low" | "medium" | "high" | null`
- `anxietyLevel: "low" | "medium" | "high" | null`
- `perceivedLoad: "within-capacity" | "near-limit" | "above-capacity" | null`
- `nextStep?: string`
- `notes?: string`
- `updatedAt: string`

#### Observações
- esta entidade deve existir separada da UI;
- ela descreve o estado subjetivo e prático da tarefa/subtarefa;
- será usada principalmente na tela Ritmo.

#### Interpretação dos campos
##### `startEase`
Quão fácil é começar esta tarefa agora.
- `low` = difícil começar
- `medium` = começo moderado
- `high` = fácil começar

##### `anxietyLevel`
Quanto de ansiedade esta tarefa gera.
- `low`
- `medium`
- `high`

##### `perceivedLoad`
Como a carga da tarefa é percebida no momento.
- `within-capacity` = dentro da capacidade atual
- `near-limit` = perto do limite
- `above-capacity` = acima da capacidade atual

---

### ExecutionRecord
Representa a forma prática de executar o item em foco.

#### Campos
- `itemType: "task" | "subtask"`
- `itemId: string`
- `mode?: string`
- `materials?: string`
- `actions?: string`
- `contacts?: string`
- `notes?: string`
- `updatedAt: string`

#### Observações
- a `ExecutionRecord` é a dimensão operacional do item;
- será mostrada junto do painel de Ritmo;
- não precisa existir como aba separada na V2.

#### Interpretação dos campos
##### `mode`
Como será feita a atividade.

Exemplos:
- sozinho
- com orientando
- com colega
- em reunião
- em laboratório

##### `materials`
Materiais, arquivos ou recursos necessários.

##### `actions`
Ações práticas a executar.

Exemplos:
- e-mail
- telefonema
- leitura
- escrita
- reunião
- envio de documento
- prática experimental

##### `contacts`
Telefones, nomes ou contatos úteis.

##### `notes`
Observações práticas adicionais.

---

## Entidades do plano operacional

### DayPlanItem
Representa um item selecionado para o dia.

#### Campos
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

#### Observações
- `project` = item vindo da estrutura de projetos;
- `inbox` = item avulso do dia;
- o plano do dia não substitui Projetos;
- ele apenas seleciona o que entra hoje.

#### Regras
- um item do plano do dia pode apontar para tarefa ou subtarefa;
- itens avulsos não precisam de projeto;
- o sistema deve permitir definir foco a partir do `DayPlanItem`.

---

## Entidades de progresso

### DailyProgress
Representa a leitura agregada do dia.

#### Campos
- `dateKey: string`
- `focusSessionsCompleted: number`
- `focusedMinutes: number`
- `completedTasks: number`
- `completedSubtasks: number`

#### Observações
- esta entidade resume o dia;
- deve ser atualizada a partir das interações reais do usuário;
- será usada na tela Progresso.

---

## Entidades do timer

### TimerSession
Representa a sessão temporal atual do foco.

#### Campos
- `phase: "focus" | "short-break" | "long-break"`
- `running: boolean`
- `remainingSeconds: number`
- `focusDurationSeconds: number`
- `shortBreakSeconds: number`
- `longBreakSeconds: number`
- `cyclesCompleted: number`
- `startedAt?: string`
- `updatedAt: string`

#### Observações
- o timer é o motor temporal do foco;
- ele não substitui Ritmo;
- ele não substitui o foco atual;
- ele depende do foco atual.

---

## Estrutura agregada do estado da aplicação

### AppState
Representa o estado persistente principal da V2.

#### Estrutura
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

---

### UIState
Representa estado efêmero de interface.

#### Campos iniciais sugeridos
- `activeTab: "timer" | "projects" | "day-plan" | "rhythm" | "progress"`
- `selectedProjectId?: string | null`
- `selectedDayPlanView?: "select" | "table"`

#### Observações
- `UIState` não precisa ser persistido integralmente;
- o domínio principal deve ser independente dessa camada.

---

## Regras de integridade

### Regra 1 — Toda tarefa deve ter projeto
- toda `Task` deve possuir `projectId`;
- se não houver projeto real, usar `Sem projeto`.

### Regra 2 — Toda subtarefa pertence a uma tarefa
- toda `Subtask` deve possuir `taskId` válido.

### Regra 3 — Foco atual é único
- só pode existir um `FocusTarget` por vez.

### Regra 4 — Plano do dia não duplica estrutura
- `DayPlanItem` referencia estrutura existente ou item avulso;
- não deve virar sistema paralelo de tarefas permanentes.

### Regra 5 — Ritmo e Execução são associados ao item
- `RhythmRecord` e `ExecutionRecord` se vinculam ao `itemType + itemId`.

### Regra 6 — Progresso deriva do uso real
- `DailyProgress` deve refletir uso real do timer e marcações do dia.

---

## Projeto provisório “Sem projeto”

### Finalidade
Evitar tarefas soltas fora da estrutura.

### Regra
Se uma tarefa existir sem vínculo a projeto real:
- ela deve ser movida para um projeto provisório `Sem projeto`.

### Objetivo
Permitir posterior:
- reorganização;
- realocação;
- exclusão consciente.

---

## Casos de uso prioritários para a V2

### Caso 1 — Criar projeto
Usuário cria um projeto real:
- nome
- cor
- descrição opcional

### Caso 2 — Criar tarefa em projeto
Usuário adiciona tarefa dentro de projeto existente.

### Caso 3 — Criar subtarefa
Usuário adiciona subtarefa dentro de uma tarefa.

### Caso 4 — Mover tarefa de projeto
Usuário move tarefa de um projeto para outro.
Tudo deve ser preservado:
- subtarefas
- ritmo
- execução
- foco, se aplicável

### Caso 5 — Definir foco
Usuário define foco atual a partir de:
- Projetos
- Plano do dia

### Caso 6 — Editar ritmo
Usuário edita:
- facilidade de início
- ansiedade associada
- carga percebida
- próximo passo

### Caso 7 — Editar execução
Usuário registra:
- modo
- materiais
- ações
- contatos
- observações

### Caso 8 — Iniciar timer
Usuário trabalha sobre foco atual por ciclos.

### Caso 9 — Montar plano do dia
Usuário:
- adiciona item de projeto
- adiciona item avulso
- define prioridade
- monta a lista do dia

### Caso 10 — Ler progresso
Usuário consulta:
- sessões
- minutos
- tarefas concluídas
- subtarefas concluídas

---

## Convenções de implementação

### IDs
Todos os IDs devem ser strings estáveis.

### Datas
Usar string ISO para persistência.

### Ordem
`order` pode ser usado em `Task` e `Subtask` para ordenação visual.

### Campos opcionais
Campos opcionais devem ser usados de forma moderada e previsível.

---

## O que este modelo evita
- inferência frágil de projeto;
- duplicação estrutural no Plano do dia;
- lógica espalhada de foco;
- mistura excessiva entre domínio e interface;
- crescimento visual sem base estável.

---

## Próximo passo após este documento
Com este modelo fechado, a próxima etapa prática é uma convergência planejada entre domínio normativo e domínio implementado.

### Frente imediata recomendada
- mapear diferenças entre este modelo e o shape atual persistido;
- definir estratégia de migração sem quebrar a V2 funcional;
- só então decidir se vale refatorar store e persistência.

### Observação
Na base atual, store e persistência local já existem. Portanto, o próximo passo não é “começar do zero”, mas alinhar o que existe a este modelo com critério.
