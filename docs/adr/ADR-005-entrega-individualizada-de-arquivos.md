# ADR-005 — Entrega individualizada de arquivos com marca d'água

## Status

ACCEPTED

## Contexto

PDF e EPUB são disponibilizados para download ilimitado após aquisição, exigindo marca d'água semivisível com dados de comprador/pedido.

## Problema

Entregar versões personalizadas sem expor arquivos privados nem alterar a regra de primeiro download usada no reembolso.

## Alternativas consideradas

1. Gerar/armazenar derivado individual e entregar por link temporário.
2. Entregar arquivo mestre público.
3. Implementar DRM completo.

## Decisão

Usar processamento assíncrono idempotente para derivado PDF/EPUB individual, armazenado privadamente e servido por autorização/URL temporária. Registrar o clique que gera o link como evento de download.

## Justificativa

Equilibra proteção solicitada e acesso ilimitado sem incluir DRM fora de escopo.

## Consequências

É necessária prova técnica para EPUB, controles contra duplicação e estratégia de capacidade/custo de armazenamento. Atualização de obra cria nova versão e notifica possuidores.

## RF/RN/RNF/UC relacionados

RF-008, RF-009, RF-014, RN-004, RNF-004, UC-004/005.
