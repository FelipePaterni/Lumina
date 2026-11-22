## Ensaio de backup/restore — 2026-11-22T21:31:49Z

| Cenário | Status | Evidência resumida |
|---|---|---|
| Dump e restauração do banco sintético isolado | BLOQUEADO | Origem `lumina_task009_test`; destino `lumina_task026_restore_5c3e4714`; Contagem de tabelas não concluída. Falha: ISOLATED_SOURCE_DATABASE_MISSING. Dump temporário removido; banco restaurado mantido para inspeção. |

## Preparação do banco isolado — 2026-11-22T21:34:28Z

| Cenário | Status | Evidência resumida |
|---|---|---|
| Preparação de `lumina_task009_test` com migrações e seed sintético | BLOQUEADO | Banco criado nesta execução: False; migrações aplicadas: False; catálogo sintético aplicado: False. Falha: DATABASE_URL_MISSING. Nenhum segredo ou URL registrado. |

