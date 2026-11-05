    # Resultado dos testes manuais - TASK-007

Executado em UTC: 2026-11-05 — atualização baseada em confirmação do responsável

Modo: verificação de pré-condições; nenhum cenário foi aprovado automaticamente.

| ID | Cenário | Status | Evidência sanitizada |
|---|---|---|---|
| MT-007-01 | Catálogo público disponível | APROVADO | Responsável confirmou API respondeu HTTP 200. |
| MT-007-02 | Página de catálogo responsiva | APROVADO | Responsável confirmou Web respondeu HTTP 200. |
| MT-007-03 | CRUD autorizado | APROVADO | Obra criada com ADMIN; duas categorias e edições física/digital com preços próprios retornadas. |
| MT-007-04 | ISBN inválido | APROVADO | ISBN inválido rejeitado com HTTP 400. |
| MT-007-05 | RBAC | BLOQUEADO | Criação do CUSTOMER falhou por erro de sintaxe no comando de seed; login retornou HTTP 401, não permitindo validar HTTP 403. |
| MT-007-06 | Visibilidade e auditoria | APROVADO | Ocultação/reexibição retornou sucesso e auditoria registrou ambas as ações com motivo. |
| MT-007-07 | Busca e teclado | NAO EXECUTADO | Pesquisar por título/autor e navegar até o campo de busca usando `Tab`; confirmar resultado e operação sem mouse. |

## O que falta testar

- MT-007-05: corrigir o comando de seed do CUSTOMER e repetir para comprovar HTTP 403.
- MT-007-07: validar busca e acessibilidade básica por teclado.
