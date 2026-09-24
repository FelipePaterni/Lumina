# ADR-003 — Identidade, privacidade e auditoria

## Status

ACCEPTED

## Contexto e problema

Há contas por e-mail/senha, quatro papéis, dados pessoais e ações administrativas sensíveis.

## Alternativas consideradas

RBAC simples sem trilha; RBAC com auditoria; provedor de identidade externo.

## Decisão

Implementar identidade local com confirmação de e-mail, recuperação de senha, RBAC, solicitação de exclusão/desativação e auditoria estruturada de ações sensíveis.

## Justificativa e consequências

Atende V1 sem dependência externa e prepara evolução. Auditoria guarda ator, ação, alvo, momento e motivo, sem PII explícita. Política legal definitiva de retenção permanece PD-002.

## Relacionados

RF-001,002,022,023; RN-001,017; RNF-001–003,008.
