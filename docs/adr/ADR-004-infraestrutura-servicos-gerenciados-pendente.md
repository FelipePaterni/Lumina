# ADR-004 — Infraestrutura com serviços gerenciados a definir

## Status

PROPOSED

## Contexto

O projeto requer banco relacional, armazenamento privado, e-mail, jobs, monitoramento e backups, mas não há provedor preferido.

## Problema

Escolher infraestrutura sem requisito de equipe/custo/região pode impor custo e lock-in indevidos.

## Alternativas consideradas

1. Serviços gerenciados em provedor a definir.
2. Infraestrutura autogerida.
3. Plataforma serverless integrada.

## Decisão

Manter serviços gerenciados como premissa arquitetural, sem selecionar fornecedor até decisão de PD-001, PD-002 e PD-004.

## Justificativa

Evita decisão silenciosa e reduz operação na V1, preservando comparação de custo, região, restauração e suporte Stripe.

## Consequências

TASK-002 está bloqueada. Produção não pode ser aprovada sem runbook de backup/restauração, monitoramento e ambiente de homologação.

## RF/RN/RNF/UC relacionados

RF-014, RNF-006, RNF-007.
