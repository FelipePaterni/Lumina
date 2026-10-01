# ADR-006 — Execução conteinerizada com Docker

## Status

ACCEPTED

## Contexto e problema

A V1 deve poder ser implantada e executada de modo reproduzível, reduzindo diferenças entre ambientes de desenvolvimento e implantação local.

## Alternativas consideradas

Execução apenas nativa; Dockerfiles sem orquestração local; Dockerfiles e Docker Compose para o ambiente local.

## Decisão

Preparar web, API e dependências locais para execução em contêineres Docker. A TASK-001 fornecerá Dockerfiles e uma composição Docker documentada, sem segredos ou dados reais incorporados às imagens.

## Justificativa e consequências

Docker padroniza a inicialização e facilita futura implantação sem impor provedor, orquestrador produtivo ou integração externa na V1. Configurações sensíveis permanecem em variáveis de ambiente e arquivos de exemplo não secretos.

## Relacionados

RNF-013; TASK-001.
