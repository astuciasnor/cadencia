# Cadência V2 — Roadmap de Implementação

## Situação atual
A V2 já possui uma base inicial organizada, com:
- nova stack definida;
- shell inicial navegável;
- separação entre legado e nova versão;
- direção conceitual consolidada.

Em 09/03/2026, o código da V2 já avançou além desse ponto e também conta com:
- build reproduzível validado;
- store real;
- persistência local;
- ligação funcional entre domínio e interface;
- features centrais já implementadas em versão inicial.

Este documento deve ser lido como direção de produto e ordem de trabalho, não como fotografia congelada do repositório em seu ponto mais antigo.

---

## Direção do produto
Cadência é um planejador de foco e execução voltado ao trabalho intelectual, orientado por projetos, tarefas e ciclos de foco, com apoio cognitivo, motivacional e operacional para reduzir procrastinação, ansiedade e sobrecarga.

### Público prioritário
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

## Diretriz de interface nesta fase
A prioridade atual de layout é:

1. tablet de 10 polegadas
2. notebook
3. celular depois

### Consequências práticas
- evitar textos grandes desnecessários
- evitar colunas sem função real
- evitar blocos altos
- usar melhor a largura da tela
- priorizar áreas úteis e leitura prática
- construir uma interface acolhedora, clara e compacta

---

## Princípios do produto
- foco atual como centro do sistema
- clareza antes de densidade
- progresso visível sem poluição
- controle calmo e progresso suave
- apoio cognitivo ao trabalho
- separar estruturar, selecionar, focar, executar e acompanhar

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
A dimensão de `Execução` não precisa existir como aba principal separada.
Ela deve existir como parte do painel de `Ritmo` da subtarefa em foco.

---

## Estado da V2
A V2 já possui:
- estrutura de pastas definida
- shell inicial
- navegação entre telas
- stack declarada
- base visual inicial
- domínio iniciado
- componentes base
- separação em relação ao legado

Em 09/03/2026, a base também já possui:
- build reproduzível confirmado com `npm run build`
- store real com `Zustand`
- persistência local em `localStorage`
- domínio estabilizado com hidratação e sincronização
- ligação real entre domínio e interface
- features completas em primeira versão ponta a ponta

Ainda falta consolidar:
- testes automatizados
- refinamento de UX em fluxos mais densos
- maior compactação visual em alguns painéis
- evolução do suporte de foco avulso dentro de `Ritmo`
- eventual desacoplamento fino de persistência por frequência de escrita do timer

---

# Etapas do Roadmap

## Etapa 0 — Validação mínima do ambiente
### Objetivo
Garantir que a base técnica da V2 seja confiável.

### Fazer
- validar dependências instaladas
- corrigir build
- validar TypeScript
- revisar encoding dos arquivos
- garantir que o projeto sobe sem ruídos básicos

### Resultado esperado
- ambiente estável
- build funcionando
- base pronta para evoluir

### Status em 09/03/2026
Concluída na base atual.

---

## Etapa 1 — Fechamento do domínio
### Objetivo
Definir o modelo de dados da V2 com clareza e estabilidade.

### Modelos centrais
- `Project`
- `Task`
- `Subtask`
- `Focus`
- `Rhythm`
- `Execution`
- `DayPlanItem`
- `DailyProgress`

### Decisões obrigatórias
- `task.projectId` real
- projeto provisório `Sem projeto`
- foco atual como entidade explícita
- Plano do dia como seleção operacional, não como estrutura paralela
- apoio cognitivo no modelo:
  - facilidade de início
  - ansiedade associada
  - carga percebida

### Resultado esperado
- domínio limpo
- tipos estáveis
- base segura para UI

### Status em 09/03/2026
Concluída em primeira versão estável. Manter refinamentos incrementais sem quebrar contratos centrais.

---

## Etapa 2 — Store e persistência local
### Objetivo
Criar o coração funcional da V2.

### Fazer
- implementar store real
- implementar adapter de persistência local
- salvar e restaurar:
  - projetos
  - tarefas
  - subtarefas
  - foco atual
  - plano do dia
  - ritmo
  - execução
  - progresso diário

### Regras
- persistência primeiro em `localStorage`
- arquitetura desacoplada para futura evolução
- sem acoplamento excessivo entre UI e persistência

### Resultado esperado
- estado real do app funcionando
- dados persistidos entre sessões
- base pronta para features ponta a ponta

### Status em 09/03/2026
Concluída em primeira versão funcional. Próximos ajustes são de robustez, não de ausência de fundação.

---

## Etapa 3 — Shell visual e sistema de interface
### Objetivo
Ajustar a experiência-base antes de crescer funcionalidades.

### Fazer
- revisar shell atual
- estabilizar navegação
- reduzir excesso de texto
- definir tokens visuais
- ajustar densidade de informação
- adaptar visual para tablet de 10"

### Regras
- evitar blocos altos
- evitar colunas desnecessárias
- privilegiar área útil
- deixar a interface limpa e agradável

### Resultado esperado
- base visual mais madura
- identidade consistente
- melhor aproveitamento de tela

### Status em 09/03/2026
Concluída em primeira versão utilizável. Segue aberta para lapidação contínua.

---

## Etapa 4 — Feature Projetos
### Objetivo
Construir a primeira feature de negócio completa.

### Fazer
- criar projeto
- editar projeto
- excluir projeto
- criar tarefa
- criar subtarefa
- mover tarefa entre projetos
- tratar `Sem projeto`
- árvore real Projeto > Tarefa > Subtarefa

### Resultado esperado
- estrutura completa e persistida
- árvore funcional
- base de organização pronta

### Status em 09/03/2026
Concluída em primeira versão funcional.

---

## Etapa 5 — Feature Ritmo
### Objetivo
Transformar a subtarefa em unidade real de execução.

### Fazer
- mostrar tarefa/subtarefa em foco
- editar:
  - facilidade de início
  - ansiedade associada
  - carga percebida
  - próximo passo
- integrar execução:
  - como será feita
  - materiais
  - ações
  - contatos
  - observações

### Resultado esperado
- painel de foco realmente útil
- apoio cognitivo concreto

### Status em 09/03/2026
Concluída em primeira versão funcional para foco vindo de projetos. Foco avulso ainda pede refinamento.

---

## Etapa 6 — Feature Timer
### Objetivo
Conectar foco atual e ciclos de trabalho.

### Fazer
- timer real
- foco / pausa curta / pausa longa
- ligação com foco atual
- destaque visual da subtarefa em foco
- UI limpa e minimalista

### Resultado esperado
- motor temporal funcional
- tela de timer bonita e direta

### Status em 09/03/2026
Concluída em primeira versão funcional.

---

## Etapa 7 — Feature Plano do dia
### Objetivo
Transformar estrutura em seleção operacional do presente.

### Fazer
- adicionar item de projeto
- adicionar item avulso
- definir prioridade A / M / B
- montar fila do dia
- definir foco a partir do plano do dia
- criar lista/tabela compacta e imprimível

### Resultado esperado
- rotina do dia organizada
- ponte real entre estrutura e execução

### Status em 09/03/2026
Concluída em primeira versão funcional. A leitura imprimível ainda pode ser refinada.

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

### Resultado esperado
- fechamento do ciclo de uso
- percepção de avanço

### Status em 09/03/2026
Concluída em primeira versão funcional.

---

## Etapa 9 — Lapidação de UX
### Objetivo
Transformar a V2 em produto agradável e consistente.

### Fazer
- reduzir textos explicativos
- remover colunas inúteis
- compactar linhas
- alinhar botões e ações
- revisar contrastes e destaques
- refinar densidade visual
- consolidar sensação de controle e progresso suave

### Resultado esperado
- produto mais leve
- experiência mais bonita
- melhor regulação cognitiva

### Status em 09/03/2026
Em andamento. Esta passa a ser a frente principal, junto com robustez e testes.

---

# Ordem prática de execução
1. Etapa 0 — validação mínima do ambiente
2. Etapa 1 — fechamento do domínio
3. Etapa 2 — store e persistência local
4. Etapa 3 — shell visual e sistema de interface
5. Etapa 4 — Projetos
6. Etapa 5 — Ritmo
7. Etapa 6 — Timer
8. Etapa 7 — Plano do dia
9. Etapa 8 — Progresso
10. Etapa 9 — lapidação de UX

---

# Leitura operacional do momento atual
Em 09/03/2026, as Etapas 0 a 8 já estão implementadas em primeira versão funcional na base atual da V2.

Em outras palavras:
o próximo movimento prático já não é “criar estado e persistência”, e sim:
- consolidar robustez
- reduzir arestas de UX
- aprofundar qualidade dos fluxos existentes
- adicionar testes e validações

---

# Regra de construção da V2
A partir daqui:
- não crescer UI sem domínio
- não crescer feature sem persistência mínima
- não repetir remendos visuais da versão anterior
- tratar desenho e arquitetura de informação como parte central do produto
