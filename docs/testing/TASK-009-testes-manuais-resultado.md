# Resultado dos testes manuais - TASK-009

Data da execução: 2026-11-10

| ID | Cenário | Status | Evidência sanitizada |
|---|---|---|---|
| MT-009-01 | Ajustar estoque físico válido | APROVADO | Revalidação em 2026-11-11 após login de papel ADMIN: PATCH HTTP `200`; estoque `5`; movimento mais recente `PHYSICAL_ADJUSTMENT`, quantidade `5`; nova auditoria `INVENTORY_PHYSICAL_ADJUSTED` encontrada. A tentativa anterior retornou HTTP `401` e não foi considerada aprovação. |
| MT-009-02 | Rejeitar estoque físico negativo | APROVADO | HTTP `400`; estoque permaneceu em `5` antes e depois da tentativa com `stock: -1`. |
| MT-009-03 | Configurar licença digital numerada | APROVADO | HTTP `200`; limite de licença digital `10`; alocações `0`; auditoria `INVENTORY_DIGITAL_LIMIT_CHANGED` encontrada para a edição. |
| MT-009-04 | Configurar licença digital ilimitada | APROVADO | HTTP `200`; limite retornou `null`; alocações `0`; nova auditoria `INVENTORY_DIGITAL_LIMIT_CHANGED` encontrada após a chamada. |
| MT-009-05 | Rejeitar limite digital inválido | APROVADO | HTTP `400`; o limite digital permaneceu `null` antes e depois da tentativa com `limit: -1`. |
| MT-009-06 | Negar alteração para CUSTOMER | APROVADO | Cadastro/confirmação/login do cliente sintético retornaram `201`; PATCH com papel CUSTOMER retornou `403`; estoque permaneceu `5`; quantidade de auditorias `INVENTORY_PHYSICAL_ADJUSTED` para a edição ficou em `1` antes/depois. Credenciais e token omitidos. |
| MT-009-07 | Criar versão de ativo privado | APROVADO | HTTP `201`; versão `1` com checksum; resposta e listagem sem `storageKey` ou `contentBase64`; uma versão listada; nova auditoria `DIGITAL_ASSET_VERSION_CREATED` encontrada. Conteúdo de teste sintético não registrado. |
| MT-009-08 | Rejeitar Base64 inválido | APROVADO | HTTP `400`; quantidade de versões permaneceu `1` antes e depois da entrada Base64 inválida. |
| MT-009-09 | Versionar sem expor original | APROVADO | HTTP `201`; versão `2` criada; listagem contém duas versões em ordem `2,1`; `storageKey` ausente; nova auditoria `DIGITAL_ASSET_VERSION_CREATED` encontrada. Conteúdo sintético não registrado. |
| MT-009-10 | Bloquear acesso público ao ativo | APROVADO | Sem Authorization, `GET /catalog/assets/:editionId` retornou HTTP `401`; caminho presumido do original retornou `404` e a resposta não correspondeu ao conteúdo sintético. Revisão da superfície de rotas: `AssetsController` só expõe listagem e criação de versões, ambos com JWT/RBAC; `InventoryController` também exige JWT/RBAC; `AppModule` não configura serving estático. |

Observação: nenhuma senha, token ou dado pessoal foi registrado. A divergência do schema foi corrigida pela migração aditiva `20261110120000_inventory_schema_reconciliation`; a consulta confirmou os objetos antes da retomada dos testes. Os dez cenários foram executados e aprovados, incluindo MT-009-01 após revalidação autenticada.

## Fechamento de gates — 2026-11-11

| Gate | Estado | Evidência/pendência |
|---|---|---|
| GATE-001 | APROVADO RETROSPECTIVAMENTE | TASK-007 DONE, ADR-004 aceito, requisitos, branch e Scope Guard conferidos em 2026-11-11. |
| GATE-002 | APROVADO RETROSPECTIVAMENTE | Histórico, código, baseline e banco isolado conferidos em 2026-11-11. |
| GATE-003 | APROVADO COM DESVIO RETROSPECTIVO | Plano mínimo registrado após a implementação; mantenedor aceitou a quebra de sequência sem retroagir datas. |
| GATE-004 | APROVADO COM DESVIO RETROSPECTIVO | Implementação revisada contra aceitação e escopo; aprovação efetiva em 2026-11-11. Ver `TASK-009-plano-retrospectivo.md`. |
| GATE-005 | APROVADO | Unitários 26/26, lint, build, integração 4/4 sem skips em `lumina_task009_test` e Prettier nos arquivos alterados da TASK-009 passaram. Evidências completas em `TASK-009-gates.md`. |
| GATE-006 | APROVADO | Dez cenários executados. MT-009-01 revalidado com HTTP `200`, estoque `5`, movimento esperado e auditoria nova. O mantenedor revisou e aprovou formalmente o GATE-006 em 2026-11-11. Uma tentativa anterior HTTP `401` foi superada pela execução autenticada. O roteiro automatizado teve sintaxe validada, mas não foi executado nesta rodada. |
| GATE-007 | APROVADO | Revisão final confirmou rastreabilidade, Scope Guard, DoD e commits. TASK-009 concluída como DONE. |

## Atualização da revalidação — 2026-11-11

O mantenedor refez o login com conta ADMIN e revalidou MT-009-01: HTTP `200`, estoque `5`, movimento `PHYSICAL_ADJUSTMENT` de quantidade `5` e nova auditoria encontrada. Nenhum e-mail, senha, token ou identificador foi incluído na evidência. O mantenedor declarou: “Revisei e aprovo o GATE-006”. GATE-006 aprovado. A conclusão final aprovou GATE-007 e marcou TASK-009 como DONE após validar commits e Scope Guard.
