# ADR-001 — Monólito modular em camadas

## Status

ACCEPTED

## Contexto e problema

A V1 precisa de transações consistentes de comércio e implantação local simulada, sem complexidade operacional prematura.

## Alternativas consideradas

Microserviços; monólito sem módulos; monólito modular em camadas.

## Decisão

Adotar monólito modular com camadas de interface, aplicação, domínio e infraestrutura. Módulos não acessam persistência de outro módulo sem contrato de aplicação.

## Justificativa e consequências

Simplifica desenvolvimento e transações de estoque/pedido, mantendo fronteiras extraíveis. Exige disciplina de dependências e testes por módulo.

## Relacionados

RF-001–023; RNF-009,012.
