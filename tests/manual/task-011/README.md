# TASK-011 — Roteiro manual de checkpoint PHASE-02

Execute em PowerShell 7 na raiz do repositório, com a API e PostgreSQL local ativos e migrações aplicadas. Use somente contas, obras e edições sintéticas. Não use originais digitais como fixture. Para a verificação de plano, conecte exclusivamente ao banco isolado `lumina_task009_test`.

Gere o relatório inicial com:

```powershell
./tests/manual/task-011/run-task-011-manual-tests.ps1
```

O script cria/atualiza `docs/testing/TASK-011-testes-manuais-resultado.md` com todos os cenários `NÃO EXECUTADO`. O responsável deve executar cada procedimento abaixo, preencher status como `APROVADO`, `REPROVADO` ou `BLOQUEADO`, registrar evidência resumida e revisar/aprovar o relatório. Não registrar credenciais, tokens, PII, conteúdo de arquivos, nem valores de `storageKey`.

## Cenários

| ID | Cenário | Procedimento resumido | Resultado esperado | Evidência a registrar | Status inicial |
|---|---|---|---|---|---|
| MT-011-01 | Catálogo sem autenticação | `Invoke-WebRequest -SkipHttpErrorCheck http://localhost:3001/works`; registrar apenas status | Listagem pública de leitura responde HTTP 200 | Método/rota e status HTTP | NÃO EXECUTADO |
| MT-011-02 | Operação de catálogo por papel não autorizado | Com CUSTOMER sintético autenticado, `Invoke-WebRequest -SkipHttpErrorCheck -Method Post -Uri http://localhost:3001/works -Headers @{ Authorization = "Bearer <token-sintetico>" } -ContentType 'application/json' -Body '{"title":"TASK011 synthetic","authorId":"<author-id-sintetico>"}'` | HTTP 403; catálogo não muda | Rota, status e confirmação de estado inalterado | NÃO EXECUTADO |
| MT-011-03 | Busca/filtros/paginação | `Invoke-WebRequest 'http://localhost:3001/works?search=synthetic&language=pt-BR&page=1&limit=10'`; repetir com página 2 e faixa de preço/data sintética | Filtros combinam, paginação estável, obra oculta ausente | Parâmetros sintéticos, status e contagens | NÃO EXECUTADO |
| MT-011-04 | Inventário por papel | `Invoke-WebRequest -SkipHttpErrorCheck -Method Get -Uri http://localhost:3001/inventory/<editionId-sintetica> -Headers @{ Authorization = "Bearer <token-CUSTOMER-sintetico>" }`; repetir com ADMIN sintético conforme `tests/manual/task-009/README.md` | ADMIN autorizado; CUSTOMER recebe 403 e estoque/limite não muda | Status e valores sintéticos antes/depois | NÃO EXECUTADO |
| MT-011-05 | Original digital privado | `Invoke-WebRequest -SkipHttpErrorCheck http://localhost:3001/catalog/assets/<editionId-sintetica>` e consultar caminho público presumido do storage. Não enviar arquivo original | HTTP 401/404; resposta não contém conteúdo nem caminho interno | Status e presença/ausência de campos sensíveis, sem seus valores | NÃO EXECUTADO |
| MT-011-06 | Wishlist isolada | Seguir `tests/manual/task-010/README.md` com duas contas CUSTOMER sintéticas e obra sintética | Terceiro não consulta/remove item alheio; dono mantém controle | Status HTTP e confirmação de isolamento; sem token | NÃO EXECUTADO |
| MT-011-07 | Índices e plano | No banco isolado `lumina_task009_test`, `psql -d lumina_task009_test -c "EXPLAIN (ANALYZE, BUFFERS) SELECT w.id FROM works w JOIN authors a ON a.id = w.author_id WHERE w.is_visible = true AND (w.title ILIKE '%synthetic%' OR a.name ILIKE '%synthetic%') ORDER BY w.release_date DESC, w.title ASC LIMIT 10;"`; repetir com filtro de edição/preço conforme busca. Revisar apenas estimativas/índices, sem compartilhar valores de dados | Plano revisado e adequado para consultas críticas; registrar conclusão, não dados de linha | Plano sanitizado com índices usados/estimativa | NÃO EXECUTADO |

Se a rota real divergir da documentação ou qualquer cenário exigir mudança de schema/código fora do escopo TASK-011, pare e registre `BLOQUEADO`; não contorne guards nem ajuste dados existentes.
