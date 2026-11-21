# Roteiro manual TASK-018 — bundles e pré-vendas

Execute em PowerShell 7 contra a API local conectada exclusivamente ao banco isolado `lumina_task009_test`. O runner recusa URLs fora de loopback e exige a confirmação explícita do banco sintético.

## Pré-condições

- Migrações aplicadas no banco `lumina_task009_test` e API local iniciada nessa mesma base.
- Uma conta CATALOG confirmada e três contas CUSTOMER confirmadas, distintas entre si e da conta CATALOG.
- Carrinhos vazios nas três contas CUSTOMER.
- Informe de 2 a 50 `WorkIds` UUID de obras visíveis, cada uma com edição DIGITAL visível e inventário configurado.
- A conta de compra integral não possui os e-books informados; a conta de posse parcial possui pelo menos um, mas não todos; a conta de posse total possui todos.
- O checkout integral cria um pedido simulado e aloca licenças digitais no banco isolado. Não use obras ou contas reais.

## Execução

```powershell
$catalog = Get-Credential -Message 'Conta CATALOG sintética e confirmada'
$buyer = Get-Credential -Message 'CUSTOMER sintético sem posse dos livros'
$partial = Get-Credential -Message 'CUSTOMER sintético com posse parcial'
$allOwned = Get-Credential -Message 'CUSTOMER sintético com posse total'

.\tests\manual\task-018\run-task-018-manual-tests.ps1 `
  -ApiBaseUrl 'http://localhost:3001' `
  -CatalogCredential $catalog `
  -FullPurchaseCredential $buyer `
  -PartialOwnerCredential $partial `
  -AllOwnedCredential $allOwned `
  -WorkIds @('UUID-DA-OBRA-1', 'UUID-DA-OBRA-2') `
  -BundlePriceCents 2000 `
  -SyntheticTestDatabaseConfirmed
```

O script mantém credenciais e tokens somente em memória, não imprime respostas completas e atualiza automaticamente `docs/testing/TASK-018-testes-manuais-resultado.md`. Ele não limpa nem apaga pedidos ou bundles. Revise os cenários e confirme o relatório após a execução; não marque resultado aprovado sem execução humana.

## Cenários

- MT-018-01: composição invertida duplicada retorna 409; CUSTOMER não cria bundle (403).
- MT-018-02: checkout do bundle confirma preço não negativo e cria uma linha de pedido para cada edição.
- MT-018-03: posse parcial reduz o preço pelos e-books já possuídos; posse total recusa o bundle.
- MT-018-04: estado `PREORDER` permanece até a data de lançamento e passa a `RELEASED` na data ou depois.
