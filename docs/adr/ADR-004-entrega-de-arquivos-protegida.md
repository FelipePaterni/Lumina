# ADR-004 — Entrega individualizada de arquivos

## Status

ACCEPTED

## Contexto e problema

PDF/ePub originais não podem ser públicos; adquirentes recebem cópia com marca d’água.

## Alternativas consideradas

Arquivo público; download do original autenticado; cópia individual e link temporário; DRM completo.

## Decisão

Manter original privado, produzir cópia PDF/ePub com nome, e-mail e ID da compra e entregar por URL temporária autenticada e renovável. Armazenamento é local simulado na V1.

## Justificativa e consequências

Reduz compartilhamento acidental sem prometer DRM. Processamento pode ser assíncrono; falhas devem ser observáveis e não liberar original.

## Relacionados

RF-006,013,014; RN-003,012; RNF-010.
