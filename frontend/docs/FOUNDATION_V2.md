# Cadência V2 — Foundation

## Finalidade
Este documento resume a base conceitual da V2 e serve como referência para decisões de produto, interface e arquitetura.

---

## Visão do produto
Cadência é um planejador de foco e execução para trabalho intelectual. Seu objetivo é reduzir procrastinação, ambiguidade, ansiedade e sobrecarga, transformando trabalho difuso em ação executável com progresso visível e calmo.

---

## Público prioritário
- professor universitário
- pesquisador
- pessoas que lidam com trabalho intelectual complexo

### Tipos de trabalho contemplados
- preparar aula e ministrar aulas
- leituras e estudos
- redigir projeto
- escrever relatórios de projeto
- escrever artigos científicos
- reuniões administrativas e colegiados
- execução de pesquisa
- práticas de aulas
- práticas de pesquisas
- planejamentos experimentais
- trabalhos administrativos
- orientações de alunos
- acompanhamento de orientandos
- revisão de textos de orientandos
- reuniões de orientação

---

## Problema central
O problema não é apenas falta de tempo. A V2 precisa lidar com:
- ambiguidade da tarefa
- dificuldade de começar
- percepção excessiva de carga
- ansiedade diante do trabalho
- ausência de conexão entre projeto, tarefa e próximo passo concreto

---

## Princípios do produto
- foco atual como centro do sistema
- clareza antes de densidade
- progresso visível sem poluição
- controle calmo e progresso suave
- apoio cognitivo ao trabalho
- separação explícita entre estruturar, selecionar, focar, executar e acompanhar

---

## Arquitetura conceitual
- Projeto
- Tarefa
- Subtarefa
- Plano do dia
- Ritmo
- Execução
- Timer
- Progresso

### Observação importante
`Execução` não precisa existir como aba principal separada.
Ela deve existir dentro da superfície de `Ritmo`.

---

## Definições centrais

### Projeto
Contêiner principal de trabalho.

Exemplos:
- disciplina
- artigo
- projeto de pesquisa
- frente de orientação
- relatório
- atividade administrativa

### Tarefa
Unidade relevante dentro de um projeto.

### Subtarefa
Unidade mais concreta e executável dentro de uma tarefa.

### Plano do dia
Seleção operacional do que entra hoje. Não substitui a estrutura de projetos.

### Ritmo
Painel do item em foco para leitura cognitiva e definição do próximo passo.

### Execução
Dimensão prática do mesmo item em foco:
- materiais
- ações
- contatos
- instruções e notas

### Timer
Motor temporal do foco:
- sessão de foco
- pausa curta
- pausa longa

### Progresso
Leitura agregada do dia:
- sessões concluídas
- minutos focados
- tarefas concluídas
- subtarefas concluídas
- progresso geral

---

## Apoio cognitivo
Cadência não mede apenas tempo. Ele deve tornar o trabalho mais executável.

### Indicadores centrais
- facilidade de início
- ansiedade associada
- carga percebida

---

## Fluxos principais

### Fluxo 1 — Estruturar
Projetos → Tarefas → Subtarefas

### Fluxo 2 — Selecionar o dia
Projetos / itens avulsos → Plano do dia

### Fluxo 3 — Entrar em foco
Projetos ou Plano do dia → foco atual → Ritmo → Timer

### Fluxo 4 — Executar com clareza
Ritmo → moldura prática de execução → Timer

### Fluxo 5 — Acompanhar
Timer → Progresso

---

## Direção de interface
A interface deve transmitir:
- clareza
- leveza
- suporte calmo
- controle
- progresso suave
- uso eficiente de espaço de tela

### Prioridade atual de layout
1. tablet de 10 polegadas
2. notebook
3. celular depois

### Evitar
- poluição visual
- textos explicativos demais
- blocos altos sem retorno
- colunas decorativas sem função
- hierarquia confusa

### Preferir
- painéis compactos e úteis
- leitura prática
- densidade visual controlada
- hierarquia estável

---

## Direção técnica
- Vite
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- Zustand
- persistência local primeiro

---

## Estrutura técnica de alto nível
- `src/domain/`
- `src/features/projects/`
- `src/features/day-plan/`
- `src/features/rhythm/`
- `src/features/timer/`
- `src/features/progress/`
- `src/components/ui/`
- `src/stores/`
- `src/adapters/`

---

## Decisão estratégica
A V2 é uma reconstrução da interface e do shell da aplicação, preservando a essência do produto sem reutilizar a interface antiga como base estrutural.
