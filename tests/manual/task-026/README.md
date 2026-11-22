# TASK-026 — revisão manual do checkpoint V1

## Ambiente e limites

- Usar somente a stack local e dados sintéticos. Não usar `.env` de produção nem bancos externos.
- A regressão de API usa `lumina_task009_test`; o ensaio de backup/restore grava em banco temporário `lumina_task026_restore_<8 hex>` sem alterar ou remover a origem.
- Não aprovar publicação: PD-001 (escala), PD-002 (política jurídica) e PD-003 (provedores) continuam pendentes e bloqueiam publicação até decisão explícita.
- O relatório do ensaio automatizado é `docs/testing/TASK-026-backup-restore-result.md`. O roteiro final humano deve ser registrado em `docs/testing/TASK-026-testes-manuais-resultado.md` sem credenciais, PII ou conteúdo de backup.

## Cenários — iniciar como `NAO EXECUTADO`

| ID | Objetivo | Procedimento humano | Resultado esperado | Estado | Evidência / falhas |
|---|---|---|---|---|---|
| MT-026-01 | Revisar rastreabilidade e regressão | Conferir a matriz de `docs/testing/TASK-026-planejamento-e-gates.md`, resultados do GATE-004 e relatórios das dependências listadas. | RF/RN/RNF/UC/ADR e gates têm evidência rastreável; nenhuma falha é omitida. | NAO EXECUTADO | Registrar arquivos/gates revisados e divergências, sem copiar dados sensíveis. |
| MT-026-02 | Revisar ensaio de backup/restore | Conferir a última seção do relatório de backup/restore e validar `APROVADO`, origem `lumina_task009_test`, banco temporário de restauração e igualdade de contagem de tabelas. | Dump íntegro restaurado no banco temporário; fonte preservada; nenhum dado real/segredo incluído. | NAO EXECUTADO | Registrar status e evidência sanitizada; não apagar o banco criado pelo ensaio durante a revisão. |
| MT-026-03 | Conferir bloqueios de publicação | Verificar README §19 e a lista PD-001–003 da matriz. | Cada decisão está marcada como aceita com evidência explícita, ou como `BLOQUEIA PUBLICAÇÃO`; nenhuma é presumida. | NAO EXECUTADO | Registrar decisões aceitas pelo responsável ou blockers mantidos. |
| MT-026-04 | Revisar elegibilidade da V1 | Revisar gates, Scope Guard, regressão e relatórios manuais aprovados das dependências. | V1 fica elegível para revisão humana quando todos os gates do checkpoint estiverem aprovados; publicação continua bloqueada por qualquer PD em aberto. | NAO EXECUTADO | Registrar aprovação humana ou motivo para aguardar. |

## Ensaio técnico de backup/restore

Se o banco isolado ainda não existir, configure `TASK009_TEST_DATABASE_URL` conforme `.env.example`. O preparador aceita somente host loopback e o nome `lumina_task009_test`; cria o banco apenas se ausente e aplica migrações e catálogo sintético idempotente. A URL fica somente em memória e não é registrada.

```powershell
./tests/manual/task-026/prepare-isolated-db.ps1
./tests/manual/task-026/run-integration-tests.ps1
```

O roteiro executável faz o ensaio local com PostgreSQL da Compose e gera relatório sanitizado:

```powershell
./tests/manual/task-026/run-backup-restore-check.ps1
```

O script recusa se a origem isolada não existir, se o serviço estiver indisponível ou se o nome temporário já existir. Gera um nome único por padrão, remove apenas o arquivo temporário de dump criado pelo próprio ensaio e mantém o banco restaurado para inspeção. Nunca remove bancos, volumes ou dados anteriores.

## Registro humano

Atualize cada cenário no relatório final com status `APROVADO`, `REPROVADO` ou `BLOQUEADO`. Não derive aprovação humana de testes automatizados. A revisão manual não autoriza publicação nem aceita PDs implicitamente.
