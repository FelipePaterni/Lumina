# ADR-007 — Autenticação JWT e seed administrativo controlado

## Status

ACCEPTED

## Contexto e problema

A V1 precisa de autenticação local para clientes e equipe, além de uma forma reprodutível e segura de criar o primeiro Administrador Geral.

## Alternativas consideradas

Sessão de servidor com cookie; JWT; provedor externo de identidade. Para o primeiro Admin: criação manual no banco; seed controlado; cadastro público com promoção posterior.

## Decisão

Usar JWTs assinados, com expiração e validação de emissor/audiência, para autenticação. Criar o primeiro Administrador Geral por seed controlado por configuração de ambiente, sem credenciais reais versionadas no repositório.

## Justificativa e consequências

JWT reduz acoplamento à sessão de servidor e atende a API planejada. O seed torna o bootstrap repetível; seus dados sensíveis devem ser fornecidos somente no ambiente de execução e jamais registrados em logs, fixtures ou imagens Docker.

## Relacionados

RF-001,023; RN-001,021; RNF-001–003; TASK-003.
