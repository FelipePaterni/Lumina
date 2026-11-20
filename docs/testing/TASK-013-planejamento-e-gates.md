# TASK-013 — Plano e evidências dos gates

Atualizado em 2026-11-20. Branch: `feature/TASK-013-pedido-checkout-transacional`.

## Prontidão e contexto

- TASK-012 está `DONE` na branch principal; a TASK-013 estava `READY` e foi iniciada na branch específica.
- Critérios: pedido híbrido único; R$ 0 confirmado sem pagamento; falta de recurso ou falha de regra não deixa pedido; cota de cupom/estoque/licença não ultrapassam o disponível; requisições repetidas são idempotentes.
- ADR-005 está `ACCEPTED` e determina confirmação simulada e validação/consumo atômicos.
- API já possui carrinho, cupons, cotação de frete, inventário e consulta de posse. Ainda não há pedidos, itens de pedido, endereço de entrega persistido, adaptador de pagamento simulado ou endpoint de checkout.
- Baseline: `npm test` 43/43; `npm run test:integration` 6/6 usando somente `lumina_task009_test`; `npm run db:generate` e `npm run build` passaram com lockfile exato, Next 16.4.6 e Prisma Client 6.19.3. Durante a geração, engines Prisma locais foram copiados do worktree de segurança aprovado porque `binaries.prisma.sh` estava inacessível por DNS.
- A instalação npm reportou sete vulnerabilidades moderadas no conjunto total; a TASK-012 já registrou auditoria de produção limpa. Auditoria final da TASK-013 será repetida.

## Plano autorizado

| Área | Mudança | Garantia |
|---|---|---|
| Persistência | `Order`, `OrderItem`, `ShippingAddress`, `Payment` e status enumerados em migração aditiva | Snapshot histórico; índices por cliente/data; chave idempotente única por cliente; endereço só para pedidos físicos |
| API de pedidos | `POST /checkout`, `GET /orders/:id`; somente CUSTOMER autenticado e com e-mail confirmado | DTOs validados; pedido alheio retorna 404; nenhuma rota admin ou biblioteca |
| Pagamento | Adaptador local simulado | Total zero gera `NOT_REQUIRED`; total positivo gera `APPROVED`; nenhuma integração externa |
| Transação | Serialização PostgreSQL; locks ordenados nas linhas do carrinho, inventário e cupom; recálculo no servidor | Estoque/licenças/cota só são consumidos dentro do commit do pedido; conflitos deixam carrinho intacto e não criam pedido |
| Idempotência | Cabeçalho `Idempotency-Key` limitado e associado ao cliente | Repetição retorna o mesmo pedido; concorrência com a mesma chave resolve para um único registro |
| Privacidade | CPF é validado em memória e não persistido, retornado ou registrado; endereço de entrega é snapshot acessível ao próprio cliente | Dados usados apenas para o pedido; sem CPF/endereço em logs |
| Testes | Unidade e integração em `tests/**/orders/**`; roteiro PowerShell em `tests/manual/task-013`; relatório sanitizado em `docs/testing/` | Cobertura de R$0, físico, híbrido, falha/rollback, idempotência, autorização e concorrência |

## Arquivos previstos

- Alterar: `TASKS.md`, `database/schema.prisma`, `apps/api/src/app.module.ts`.
- Criar: `apps/api/src/modules/orders/**`, `apps/api/src/modules/payments/**`, migração `database/migrations/*_task_013_orders/**`, testes de unidade/integração, roteiro manual e relatório sanitizado.
- Não tocar: `apps/web/**`, `apps/api/src/modules/library/**`, `apps/api/src/modules/inventory/**`, notificações, bundles, pré-vendas, gateways externos e arquivos de ambiente.

## Riscos e mitigação

- Concorrência e retry de transação: bloquear IDs em ordem estável, usar isolamento `Serializable`, repetir somente conflitos transitórios e sempre consultar pedido existente pela chave idempotente.
- Cupom ou frete alterado: ler e validar novamente dentro da transação.
- PII: validar CPF sem persistir; persistir apenas os campos necessários ao snapshot do endereço físico; responder dados somente ao dono do pedido.
- Falha durante confirmação: transação reverte recursos, pedido, pagamento e limpeza do carrinho em conjunto.
- Reversão: migração é aditiva e forward-only; não executar rollback automático em dados persistidos.

## Estado dos gates

| Gate | Estado | Evidência |
|---|---|---|
| GATE-001 — Prontidão | APROVADO | TASK-012 `DONE`; critérios/DoD existem; branch `feature/TASK-013-pedido-checkout-transacional`; árvore inicial limpa. |
| GATE-002 — Contexto | APROVADO | README, TASKS, ADR-005, código/testes da TASK-012; baseline 43 unitários, 6 integrações e build com dependências alinhadas. |
| GATE-003 — Planejamento | APROVADO | Plano acima respeita API de pedidos/pagamento simulado e banco; sem web, biblioteca/download ou gateway. Artefatos manuais incluídos no Scope Guard para cumprir AGENTS.md. |
| GATE-004 — Implementação | APROVADO | API de pedido e pagamento simulado, transação serializável, migração aditiva e testes implementados; diff dentro do Scope Guard. `app.module.ts` apenas registra o módulo novo. |
| GATE-005 — Gates automatizados | APROVADO | lint; 46/46 unitários; 7/7 integrações em `lumina_task009_test`; migração aplicada duas vezes; Prisma validate; audit de produção 0; build completo; scripts manuais analisados; diff sem whitespace. |
| GATE-006 — Testes manuais | EXECUTADO; AGUARDA REVISÃO | Relatório de 2026-11-20 registra MT-013-01 a MT-013-04 aprovados e limpeza confirmada. Falta revisão/aprovação explícita do responsável. |
| GATE-007 — Conclusão | PENDENTE | — |

## Scope Guard

Mudanças primárias: módulos API de pedidos e pagamento simulado; schema/migração; testes unitários e de integração; `TASKS.md`. Caminhos foram especificados sob a raiz real `apps/api/src/modules/`. O registro em `apps/api/src/app.module.ts` é incidental mínimo para ativar o módulo. O roteiro `tests/manual/task-013/**` e o relatório sanitizado `docs/testing/TASK-013-*.md` cumprem o `AGENTS.md`, sem ampliar requisitos de produto. Nenhum caminho proibido foi alterado.

## Registro da execução manual no runner

Na execução inicial pelo Codex, o PowerShell não conseguiu abrir sockets loopback do host. O responsável executou o roteiro no PowerShell local em 2026-11-20; MT-013-01 a MT-013-04 passaram e a limpeza foi confirmada no relatório sanitizado. Aguarda revisão/aprovação explícita do relatório para fechar o gate manual.
