# ADR-003 — Identidade, RBAC, privacidade e auditoria

## Status

ACCEPTED

## Contexto

Há dados pessoais brasileiros, três papéis, compras restritas a adultos confirmados e exclusão condicionada à retenção legal.

## Problema

Proteger conta/dados e rastrear decisões administrativas sem decidir de forma inválida a política jurídica de retenção.

## Alternativas consideradas

1. RBAC, ownership, auditoria e exclusão configurável.
2. Acesso administrativo irrestrito sem auditoria.
3. Exclusão física imediata.

## Decisão

Aplicar RBAC e ownership em toda operação sensível; CPF único/imutável, e-mail confirmado, maioridade e termos para comprar. Auditar ações definidas e desativar conta na solicitação; eliminação/anonimização final fica vinculada a política jurídica aprovada.

## Justificativa

Atende ao mínimo de segurança e permite conformidade sem assumir prazo legal não validado.

## Consequências

PD-003 bloqueia lançamento se não estiver resolvida; logs e auditoria precisam minimizar dados sensíveis. Ao menos um administrador geral ativo deve ser preservado.

## RF/RN/RNF/UC relacionados

RF-001, RF-002, RF-013, RF-015, RN-001, RN-009, RNF-004, RNF-008, UC-001, UC-008.
