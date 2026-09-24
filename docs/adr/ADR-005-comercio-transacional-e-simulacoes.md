# ADR-005 — Comércio transacional com adaptadores simulados

## Status

ACCEPTED

## Contexto e problema

A V1 confirma pagamento imediatamente, calcula frete sem serviço externo e envia e-mails simulados, sem perder rastreabilidade.

## Alternativas consideradas

Integrações reais agora; regras espalhadas pela UI; adaptadores simulados atrás de contratos.

## Decisão

Checkout será transacional e usará adaptadores de pagamento, frete, e-mail e arquivos simulados. Estoque/licença, cupom e pedido são validados atomicamente na confirmação.

## Justificativa e consequências

Permite testar regras reais de domínio e substituir integrações depois. Não reservar carrinho evita expiração artificial; falta na confirmação resulta em conflito sem pedido.

## Relacionados

RF-010–012,017,020; RN-004,008–011; RNF-009.
