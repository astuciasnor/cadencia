# Cadência V2 — Roadmap de Implementação

## Situação atual
A V2 já possui:
- stack definida
- shell navegável
- separação entre legado e nova versão
- domínio implementado em primeira versão
- store real
- persistência local
- features centrais funcionando em versão inicial

Este roadmap continua valendo como ordem de trabalho e referência de evolução.

---

## Direção do produto
Cadência é um planejador de foco e execução voltado ao trabalho intelectual, orientado por projetos, tarefas e ciclos de foco, com apoio cognitivo e operacional para reduzir procrastinação, ansiedade e sobrecarga.

---

## Diretriz de interface nesta fase
Prioridade de layout:
1. tablet de 10 polegadas
2. notebook
3. celular depois

### Consequências práticas
- evitar textos grandes desnecessários
- evitar colunas sem função real
- evitar blocos altos
- usar melhor a largura da tela
- priorizar áreas úteis e leitura prática
- manter interface acolhedora, clara e compacta

---

## Princípios do produto
- foco atual como centro do sistema
- clareza antes de densidade
- progresso visível sem poluição
- controle calmo e progresso suave
- apoio cognitivo ao trabalho
- separar estruturar, selecionar, focar, executar e acompanhar

---

## Etapas

## Etapa 0 — Validação mínima do ambiente
### Objetivo
Garantir base técnica confiável.

### Fazer
- validar dependências
- validar build
- validar TypeScript
- revisar encoding

### Status em 09/03/2026
Concluída.

---

## Etapa 1 — Fechamento do domínio
### Objetivo
Estabilizar o modelo de dados da V2.

### Modelos centrais
- `Project`
- `Task`
- `Subtask`
- `Focus`
- `Rhythm`
- `Execution`
- `DayPlanItem`
- `DailyProgress`

### Status em 09/03/2026
Concluída em primeira versão estável.

---

## Etapa 2 — Store e persistência local
### Objetivo
Criar o coração funcional da V2.

### Fazer
- store real
- adapter de `localStorage`
- serialização e restauração do estado

### Status em 09/03/2026
Concluída em primeira versão funcional.

---

## Etapa 3 — Shell visual e sistema de interface
### Objetivo
Estabilizar a experiência-base antes de crescer novas funcionalidades.

### Fazer
- revisar shell
- estabilizar navegação
- reduzir excesso de texto
- ajustar densidade visual
- adaptar para tablet de 10"

### Status em 09/03/2026
Concluída em primeira versão utilizável.

---

## Etapa 4 — Feature Projetos
### Objetivo
Construir a primeira feature estrutural completa.

### Fazer
- criar, editar e excluir projeto
- criar tarefa
- criar subtarefa
- mover tarefa entre projetos
- tratar `Sem projeto`
- manter árvore Projeto > Tarefa > Subtarefa

### Status em 09/03/2026
Concluída em primeira versão funcional.

---

## Etapa 5 — Feature Ritmo
### Objetivo
Transformar o item em foco em unidade real de execução.

### Fazer
- mostrar foco atual
- editar indicadores cognitivos
- editar próximo passo
- integrar execução

### Status em 09/03/2026
Concluída em primeira versão funcional, com refinamentos ainda pendentes para foco avulso.

---

## Etapa 6 — Feature Timer
### Objetivo
Conectar foco atual e ciclos de trabalho.

### Fazer
- timer real
- fase de foco, pausa curta e pausa longa
- ligação com foco atual
- UI limpa e direta

### Status em 09/03/2026
Concluída em primeira versão funcional.

---

## Etapa 7 — Feature Plano do dia
### Objetivo
Transformar estrutura em seleção operacional do presente.

### Fazer
- adicionar item de projeto
- adicionar item avulso
- definir prioridade
- montar lista do dia
- definir foco a partir do plano

### Status em 09/03/2026
Concluída em primeira versão funcional.

---

## Etapa 8 — Feature Progresso
### Objetivo
Entregar leitura agregada do dia.

### Fazer
- sessões concluídas
- minutos focados
- tarefas concluídas
- subtarefas concluídas
- progresso geral

### Status em 09/03/2026
Concluída em primeira versão funcional.

---

## Etapa 9 — Lapidação de UX
### Objetivo
Transformar a V2 em produto mais agradável, compacto e consistente.

### Fazer
- reduzir textos explicativos
- remover colunas inúteis
- compactar linhas
- revisar contrastes e destaques
- refinar densidade visual
- consolidar sensação de controle e progresso suave

### Status em 09/03/2026
Em andamento.

---

## Próximo foco real
O próximo movimento prático já não é criar fundação de store ou persistência. O foco agora é:
- robustez
- testes
- lapidação de UX
- refinamento dos fluxos existentes
- convergência entre domínio normativo e domínio implementado

---

## Regra de construção da V2
- não crescer UI sem domínio
- não crescer feature sem persistência mínima
- não repetir remendos visuais da versão anterior
- tratar arquitetura de informação como parte central do produto
