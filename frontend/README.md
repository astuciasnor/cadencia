# Cadência V2 — Frontend

Esta pasta concentra a nova versão da interface do Cadência.

## Princípio
- o projeto atual permanece como legado de referência
- a V2 é reconstruída em paralelo
- o domínio será reescrito com base conceitual limpa, sem copiar a interface antiga

## Estado atual em 09/03/2026
- build validado com `npm run build`
- store real com `Zustand`
- persistência local em `localStorage`
- features iniciais de `Projetos`, `Ritmo`, `Timer`, `Plano do dia` e `Progresso`
- prioridade visual: tablet de 10 polegadas primeiro, notebook depois
- `Execução` integrada a `Ritmo`, não como aba principal separada

## Estrutura

```text
frontend/
  index.html
  package.json
  vite.config.ts
  tailwind.config.ts
  src/
    app/
      AppShell.tsx
      navigation.ts
    domain/
      types.ts
      constants.ts
      focus.ts
      projects.ts
      tasks.ts
      day-plan.ts
      timer.ts
    features/
      projects/
      day-plan/
      rhythm/
      timer/
      progress/
    components/
      ui/
    stores/
      app-store.ts
    adapters/
      local-storage/
        README.md
        types.ts
    lib/
      utils.ts
    App.tsx
    main.tsx
    index.css
```

## Critério de separação
- `domain/`: contratos e regras puras do produto
- `features/`: cada área principal do app
- `components/ui/`: primitives de interface
- `stores/`: estado de aplicação
- `adapters/`: persistência e integração externa
- `app/`: shell, navegação e composição de alto nível
