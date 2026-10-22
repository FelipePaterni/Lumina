# Índice global — prompts de execução das TASKs

Este diretório contém somente workflows e prompts operacionais; não comprova que qualquer TASK tenha sido executada. Cada etapa exige aprovação do gate anterior por evidência.

| TASK | Descrição resumida | Etapas | Dependências | Pasta | Primeiro prompt |
|---|---|---:|---|---|---|
| TASK-001 | Inicializar estrutura e qualidade | 7 | `DEPENDS_ON: NONE` | [task-001](./task-001/) | [etapa 001](./task-001/prompt-task-001-etapa-001-recontextualizacao-e-prontidao.md) |
| TASK-002 | Base de persistência e migrações | 7 | `DEPENDS_ON: TASK-001` | [task-002](./task-002/) | [etapa 001](./task-002/prompt-task-002-etapa-001-recontextualizacao-e-prontidao.md) |
| TASK-003 | Identidade e confirmação de e-mail | 7 | `DEPENDS_ON: TASK-001, TASK-002` | [task-003](./task-003/) | [etapa 001](./task-003/prompt-task-003-etapa-001-recontextualizacao-e-prontidao.md) |
| TASK-004 | RBAC, auditoria e exclusão solicitada | 7 | `DEPENDS_ON: TASK-003` | [task-004](./task-004/) | [etapa 001](./task-004/prompt-task-004-etapa-001-recontextualizacao-e-prontidao.md) |
| TASK-005 | Checkpoint PHASE-01 | 5 | `DEPENDS_ON: TASK-004` | [task-005](./task-005/) | [etapa 001](./task-005/prompt-task-005-etapa-001-recontextualizacao-e-prontidao.md) |
| TASK-006 | Checkpoint de transição PHASE-01 | 5 | `DEPENDS_ON: TASK-001, TASK-002, TASK-003, TASK-004, TASK-005` | [task-006](./task-006/) | [etapa 001](./task-006/prompt-task-006-etapa-001-recontextualizacao-e-prontidao.md) |
| TASK-007 | Domínio e administração do catálogo | 7 | `DEPENDS_ON: TASK-006` | [task-007](./task-007/) | [etapa 001](./task-007/prompt-task-007-etapa-001-recontextualizacao-e-prontidao.md) |
| TASK-008 | Busca e filtros básicos de catálogo | 7 | `DEPENDS_ON: TASK-007` | [task-008](./task-008/) | [etapa 001](./task-008/prompt-task-008-etapa-001-recontextualizacao-e-prontidao.md) |
| TASK-009 | Inventário e ativos privados | 7 | `DEPENDS_ON: TASK-007` | [task-009](./task-009/) | [etapa 001](./task-009/prompt-task-009-etapa-001-recontextualizacao-e-prontidao.md) |
| TASK-010 | Wishlist básica | 7 | `DEPENDS_ON: TASK-007` | [task-010](./task-010/) | [etapa 001](./task-010/prompt-task-010-etapa-001-recontextualizacao-e-prontidao.md) |
| TASK-011 | Checkpoint PHASE-02 | 5 | `DEPENDS_ON: TASK-007, TASK-008, TASK-009, TASK-010` | [task-011](./task-011/) | [etapa 001](./task-011/prompt-task-011-etapa-001-recontextualizacao-e-prontidao.md) |
| TASK-012 | Carrinho, cupom e frete | 7 | `DEPENDS_ON: TASK-011` | [task-012](./task-012/) | [etapa 001](./task-012/prompt-task-012-etapa-001-recontextualizacao-e-prontidao.md) |
| TASK-013 | Pedido e checkout transacional | 7 | `DEPENDS_ON: TASK-012` | [task-013](./task-013/) | [etapa 001](./task-013/prompt-task-013-etapa-001-recontextualizacao-e-prontidao.md) |
| TASK-014 | Notificações e ciclo de pedido | 7 | `DEPENDS_ON: TASK-012, TASK-013` | [task-014](./task-014/) | [etapa 001](./task-014/prompt-task-014-etapa-001-recontextualizacao-e-prontidao.md) |
| TASK-015 | Checkpoint PHASE-03 | 5 | `DEPENDS_ON: TASK-014` | [task-015](./task-015/) | [etapa 001](./task-015/prompt-task-015-etapa-001-recontextualizacao-e-prontidao.md) |
| TASK-016 | Checkpoint de transição PHASE-03 | 5 | `DEPENDS_ON: TASK-012, TASK-013, TASK-014, TASK-015` | [task-016](./task-016/) | [etapa 001](./task-016/prompt-task-016-etapa-001-recontextualizacao-e-prontidao.md) |
| TASK-017 | Biblioteca, download e marca d’água | 7 | `DEPENDS_ON: TASK-016` | [task-017](./task-017/) | [etapa 001](./task-017/prompt-task-017-etapa-001-recontextualizacao-e-prontidao.md) |
| TASK-018 | Bundles e pré-vendas | 7 | `DEPENDS_ON: TASK-017` | [task-018](./task-018/) | [etapa 001](./task-018/prompt-task-018-etapa-001-recontextualizacao-e-prontidao.md) |
| TASK-019 | Cancelamentos e reembolsos | 7 | `DEPENDS_ON: TASK-017, TASK-018` | [task-019](./task-019/) | [etapa 001](./task-019/prompt-task-019-etapa-001-recontextualizacao-e-prontidao.md) |
| TASK-020 | Checkpoint PHASE-04 | 5 | `DEPENDS_ON: TASK-017, TASK-018, TASK-019` | [task-020](./task-020/) | [etapa 001](./task-020/prompt-task-020-etapa-001-recontextualizacao-e-prontidao.md) |
| TASK-021 | Estoque e logística física | 7 | `DEPENDS_ON: TASK-020` | [task-021](./task-021/) | [etapa 001](./task-021/prompt-task-021-etapa-001-recontextualizacao-e-prontidao.md) |
| TASK-022 | Avaliações, denúncia e moderação | 7 | `DEPENDS_ON: TASK-020` | [task-022](./task-022/) | [etapa 001](./task-022/prompt-task-022-etapa-001-recontextualizacao-e-prontidao.md) |
| TASK-023 | Painéis e relatórios essenciais | 7 | `DEPENDS_ON: TASK-020, TASK-021` | [task-023](./task-023/) | [etapa 001](./task-023/prompt-task-023-etapa-001-recontextualizacao-e-prontidao.md) |
| TASK-024 | Privacidade operacional e observabilidade | 7 | `DEPENDS_ON: TASK-020` | [task-024](./task-024/) | [etapa 001](./task-024/prompt-task-024-etapa-001-recontextualizacao-e-prontidao.md) |
| TASK-027 | Rankings de descoberta pós-venda | 7 | `DEPENDS_ON: TASK-022` | [task-027](./task-027/) | [etapa 001](./task-027/prompt-task-027-etapa-001-recontextualizacao-e-prontidao.md) |
| TASK-025 | Acessibilidade, responsividade e desempenho | 7 | `DEPENDS_ON: TASK-021, TASK-022, TASK-023, TASK-024, TASK-027` | [task-025](./task-025/) | [etapa 001](./task-025/prompt-task-025-etapa-001-recontextualizacao-e-prontidao.md) |
| TASK-026 | Checkpoint final V1 | 5 | `DEPENDS_ON: TASK-021, TASK-022, TASK-023, TASK-024, TASK-025, TASK-027` | [task-026](./task-026/) | [etapa 001](./task-026/prompt-task-026-etapa-001-recontextualizacao-e-prontidao.md) |

## Regras comuns

- Comece pelo primeiro prompt da TASK e nunca avance com gate bloqueado.
- Testes manuais devem ser executados pelo responsável no fluxo Windows → WSL; roteiros começam como NÃO EXECUTADO.
- Falhas exigem diagnóstico, menor correção autorizada e reexecução. Alterações fora do Scope Guard exigem SCOPE ESCALATION.
- O estado do backlog permanece em TASKS.md; estes documentos não alteram o estado de execução.
