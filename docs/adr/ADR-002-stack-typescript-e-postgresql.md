# ADR-002 — Stack inicial TypeScript e PostgreSQL

## Status

ACCEPTED

## Contexto e problema

Não há preferência tecnológica. O sistema exige UI responsiva, API tipada e banco transacional.

## Alternativas consideradas

Next.js + NestJS + PostgreSQL; Java/Spring + React + PostgreSQL; .NET + React + PostgreSQL; Django + React + PostgreSQL.

## Decisão

Usar Next.js/React para web, NestJS/TypeScript para API e PostgreSQL. Adotar ORM com migrações e contratos de armazenamento/notificação independentes do provedor.

## Justificativa e consequências

TypeScript ponta a ponta reduz contexto e suporta módulos tipados; PostgreSQL é adequado a transações e consultas. A decisão não instala dependências nesta fase. Mudança futura requer ADR substitutivo.

## Relacionados

RNF-009,012; TASK-001–002.
