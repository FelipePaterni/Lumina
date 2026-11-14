# TASK-010 — Roteiro manual

## Pré-condições

- API e PostgreSQL local do projeto ativos e com a migração da wishlist aplicada.
- Duas contas sintéticas `CUSTOMER` confirmadas e sem a obra de teste na wishlist.
- `WorkId` identifica uma obra sintética visível que possa ser removida da lista ao fim do roteiro.
- Execute em PowerShell 7 a partir da raiz do repositório. As credenciais são pedidas interativamente e mantidas somente em memória.

```powershell
$clienteA = Get-Credential
$clienteB = Get-Credential
./tests/manual/task-010/run-task-010-manual-tests.ps1 `
  -WorkId '<id-da-obra-sintetica>' `
  -CustomerA $clienteA `
  -CustomerB $clienteB
```

O script verifica a rota sem autenticação, inclusão, duplicação, isolamento entre clientes, recusa de remoção por terceiro, preservação do item e remoção pelo dono. Gera um relatório sanitizado em `docs/testing/TASK-010-testes-manuais-resultado.md`. Não execute contra dados reais.

| ID | Cenário | Resultado esperado | Estado inicial |
|---|---|---|---|
| MT-010-01 | Consulta sem autenticação | HTTP 401 | NÃO EXECUTADO |
| MT-010-02 | Login de dois clientes sintéticos | Dois tokens válidos; nenhum valor registrado | NÃO EXECUTADO |
| MT-010-03 | Dono inclui obra visível | HTTP 201 | NÃO EXECUTADO |
| MT-010-04 | Mesmo cliente inclui duplicata | HTTP 409 | NÃO EXECUTADO |
| MT-010-05 | Outro cliente consulta lista | Obra não aparece | NÃO EXECUTADO |
| MT-010-06 | Outro cliente tenta remover obra | HTTP 404 | NÃO EXECUTADO |
| MT-010-07 | Dono consulta após tentativa de terceiro | Obra permanece | NÃO EXECUTADO |
| MT-010-08 | Dono remove a obra | HTTP 200 | NÃO EXECUTADO |
