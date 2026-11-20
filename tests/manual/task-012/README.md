# TASK-012 — Roteiro de testes manuais

## Pré-condições

- PowerShell 7, Node 24 e a API/web/PostgreSQL local em execução.
- A migração `20261120120000_task_012_commerce_foundation` aplicada no mesmo banco local da API.
- Conta sintética `CUSTOMER` com e-mail confirmado e carrinho vazio; conta sintética `ADMIN` ativa.
- Para manter contas de teste reproduzíveis, configure `ADMIN_SEED_EMAIL`/`ADMIN_SEED_PASSWORD` e as duas contas `TEST_CUSTOMER_*` no `.env`; habilite `LOCAL_TEST_ACCOUNTS_ENABLED=true`. Os CUSTOMER seed são criados/atualizados no bootstrap local da API. Use somente e-mails `@example.invalid`; o seed é desabilitado em produção.
- Catálogo com uma edição física visível e pelo menos uma unidade em estoque, além de uma edição digital visível. O roteiro procura os IDs na API e lê o estoque; não o altera.
- Execute somente contra o PostgreSQL local `lumina` ou `lumina_task009_test`. Nunca use produção. O ajuste temporário de cota altera somente o cupom sintético `T012-MANUAL-*` criado pelo próprio roteiro e o restaura no `finally`.

## Execução

Na raiz do repositório, configure as credenciais sintéticas no `.env` (ignorado pelo Git). Para rodar os cenários, forneça-as interativamente; tokens permanecem na memória do processo:

```powershell
$customer = Get-Credential -Message 'Conta CUSTOMER sintética confirmada'
$admin = Get-Credential -Message 'Conta ADMIN sintética'
./tests/manual/task-012/run-task-012-manual-tests.ps1 `
  -ApiBaseUrl 'http://localhost:3001' `
  -CustomerCredential $customer `
  -AdminCredential $admin
```

O script descobre as edições, cria cupom e regra de frete sintéticos, executa os cenários, remove itens do carrinho e desativa as configurações criadas. Em caso de falha, revise o relatório e as configurações `T012-MANUAL-*`/`T012-EXP-*` localmente; nunca copie credenciais, tokens, CPF ou endereço para o relatório.

## Cenários

| ID | Objetivo | Pré-condições | Procedimento | Resultado esperado | Evidência/status inicial |
|---|---|---|---|---|---|
| MT-012-01 | Negar carrinho sem token | API ativa | `GET /cart` sem Authorization | HTTP 401 | Código HTTP; NÃO EXECUTADO |
| MT-012-02 | Isolar papel cliente | Customer e Admin sintéticos | GET `/cart` com ambos os tokens | Customer 200; Admin 403 | Códigos HTTP; NÃO EXECUTADO |
| MT-012-03 | Persistir item físico | Carrinho vazio; edição física em estoque | POST `/cart/items`, depois GET `/cart` | HTTP 201; item permanece; preço/subtotal recalculados do catálogo | Código HTTP e presença; NÃO EXECUTADO |
| MT-012-04 | Recusar e-book duplicado/possuído | Edição digital e customer sintéticos | Adicionar e repetir; primeira inclusão também pode ser recusada por posse prévia | Primeira inclusão 201 e duplicata 409, ou posse prévia 409 | Códigos HTTP; NÃO EXECUTADO |
| MT-012-05 | Recusar quantidade inválida | Edição física no carrinho | PATCH quantidade zero | HTTP 400; item preservado | Código HTTP; NÃO EXECUTADO |
| MT-012-06 | Validar cupom e validade | Admin e customer sintéticos | Aplicar cupom ativo; depois cupom expirado | Ativo 201; expirado 409; apenas um cupom associado | Códigos HTTP; NÃO EXECUTADO |
| MT-012-07 | Recusar cota esgotada | Cupom sintético criado pelo roteiro | Preparar somente esse cupom com uso=max; aplicar; restaurar uso no `finally` | HTTP 409; uso restaurado | Código HTTP; NÃO EXECUTADO |
| MT-012-08 | Validar CPF/endereço e calcular frete | Edição física e regra de frete | Cotar com CPF inválido e depois dados sintéticos válidos | Inválido 400; válido 201; frete positivo e total = subtotal − desconto + frete | Códigos HTTP/valores monetários, sem dados de endereço; NÃO EXECUTADO |
| MT-012-09 | Não cobrar frete sem item físico | Carrinho digital elegível | Remover físico e cotar | HTTP 201; frete R$ 0,00 sem exigir endereço | Código HTTP/valor; NÃO EXECUTADO |
| MT-012-10 | Confirmar limpeza | Execução completa | Revisar limpeza feita no bloco `finally` | Itens do roteiro removidos; cupom/regra criados inativos; cota restaurada | Resultado sanitizado; NÃO EXECUTADO |

## Limite desta TASK

O roteiro só calcula o resumo do carrinho. Não cria nem confirma pedidos e não simula pagamento. O consumo definitivo de estoque e da cota do cupom pertence à confirmação atômica da TASK-013.
