# Resultado dos testes manuais - TASK-006

Executado em UTC: 2026-11-02T21:37:24Z

Tokens, senhas e PII foram omitidos. O relatÃ³rio contÃ©m somente resultados sanitizados.

| ID | Cenario | Status | Evidencia sanitizada |
|---|---|---|---|
| MT-006-01 | SuperfÃ­cies locais | APROVADO | Web HTTP 200; API verificada separadamente. |
| MT-006-02 | Acesso administrativo sem credencial | APROVADO | admin/users=401; admin/audit-logs=401. |
| MT-006-03 | Cliente em rota administrativa | APROVADO | Cliente CUSTOMER recebeu HTTP 403; token nÃ£o registrado. |
| MT-006-05 | DesativaÃ§Ã£o e reativaÃ§Ã£o | APROVADO | DesativaÃ§Ã£o=201; reativaÃ§Ã£o=201. |
| MT-006-04 | Motivo e auditoria | BLOQUEADO | Defina TASK006_ADMIN_EMAIL e TASK006_ADMIN_PASSWORD para executar este cenÃ¡rio. |
| MT-006-06 | Isolamento Web/API e segredos | APROVADO | Nenhuma referÃªncia direta a banco encontrada em apps/web. |

## AnÃ¡lise

A aprovaÃ§Ã£o da Etapa 005 depende de todos os cenÃ¡rios crÃ­ticos aprovados e da revisÃ£o humana deste relatÃ³rio. CenÃ¡rios BLOQUEADO exigem correÃ§Ã£o de ambiente ou credenciais sintÃ©ticas e nova execuÃ§Ã£o.

## Ambiente

API: http://localhost:3001; Web: http://localhost:3000; dados: PostgreSQL local do Compose.
