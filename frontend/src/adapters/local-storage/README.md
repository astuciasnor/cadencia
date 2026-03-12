# Local Storage Adapter

Esta pasta será a ponte entre o domínio da V2 e a persistência local do navegador.

## Responsabilidade
- salvar e carregar `AppState`
- versionar schema
- migrar dados do legado de forma explícita
- manter o domínio desacoplado da API de armazenamento

## Regra
Nenhuma regra de interface deve morar aqui. Este adapter conhece persistência, não UX.
