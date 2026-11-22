# Backlog executável

Estados: `BLOCKED | READY | IN_PROGRESS | IN_REVIEW | DONE | FAILED | CANCELLED`. A ordem abaixo é topológica; apenas a primeira TASK elegível pode iniciar.

| Ordem | TASK | Fase | Prioridade | Dependências | Estado |
|---:|---|---|---|---|---|
| 1 | TASK-001 | PHASE-01 | CRITICAL | NONE | DONE |
| 2 | TASK-002 | PHASE-01 | HIGH | 001 | DONE |
| 3 | TASK-003 | PHASE-01 | CRITICAL | 001,002 | DONE |
| 4 | TASK-004 | PHASE-01 | HIGH | 003 | DONE |
| 5 | TASK-005 | PHASE-01 | HIGH | 004 | DONE |
| 6 | TASK-006 | PHASE-01 | CRITICAL | 001–005 | DONE |
| 7 | TASK-007 | PHASE-02 | CRITICAL | 006 | DONE |
| 8 | TASK-008 | PHASE-02 | HIGH | 007 | DONE |
| 9 | TASK-009 | PHASE-02 | HIGH | 007 | DONE |
| 10 | TASK-010 | PHASE-02 | HIGH | 007 | DONE |
| 11 | TASK-011 | PHASE-02 | CRITICAL | 007–010 | DONE |
| 12 | TASK-012 | PHASE-03 | CRITICAL | 011 | DONE |
| 13 | TASK-013 | PHASE-03 | HIGH | 012 | DONE |
| 14 | TASK-014 | PHASE-03 | CRITICAL | 012,013 | DONE |
| 15 | TASK-015 | PHASE-03 | HIGH | 014 | DONE |
| 16 | TASK-016 | PHASE-03 | CRITICAL | 012–015 | DONE |
| 17 | TASK-017 | PHASE-04 | CRITICAL | 016 | DONE |
| 18 | TASK-018 | PHASE-04 | HIGH | 017 | DONE |
| 19 | TASK-019 | PHASE-04 | HIGH | 017,018 | DONE |
| 20 | TASK-020 | PHASE-04 | CRITICAL | 017–019 | DONE |
| 21 | TASK-021 | PHASE-05 | HIGH | 020 | DONE |
| 22 | TASK-022 | PHASE-05 | HIGH | 020 | DONE |
| 23 | TASK-023 | PHASE-05 | HIGH | 020,021 | DONE |
| 24 | TASK-024 | PHASE-05 | HIGH | 020 | DONE |
| 25 | TASK-028 | PHASE-05 | HIGH | 023 | DONE |
| 26 | TASK-027 | PHASE-05 | HIGH | 022,023 | IN_PROGRESS |
| 27 | TASK-025 | PHASE-05 | HIGH | 021–024,027 | BLOCKED |
| 28 | TASK-026 | PHASE-05 | CRITICAL | 021–025,027 | BLOCKED |

## Políticas comuns

Todo item abaixo herda `INCIDENTAL_CHANGES_POLICY: MINIMAL_DIRECTLY_CAUSED_CHANGES_ALLOWED`, salvo indicação contrária. Cada TASK exige testes definidos, atualização do próprio estado em `TASKS.md` e DoD global de `AGENTS.md`. Mudanças incidentais devem constar do relatório; se não existirem: `Incidental Changes: NONE`.

### TASK-001 — Inicializar estrutura e qualidade
**Status:** DONE · **Phase:** PHASE-01 · **Priority:** CRITICAL
**Objetivo:** Criar estrutura da stack decidida, ferramentas de build/lint/teste e convenções mínimas.
**Dependências:** `DEPENDS_ON: NONE`
**Relacionados:** ADR-001, ADR-002, ADR-006, RNF-012,013.
**Artefatos esperados:** projetos web/API, configuração de qualidade, Dockerfiles, composição Docker local e instruções de execução.
**ALLOWED_CHANGES:** arquivos-raiz de build e Docker; `apps/**`; `packages/**`; `tests/**`; documentação de execução; `TASKS.md`.
**FORBIDDEN_CHANGES:** requisitos/ADRs; integrações externas; regras de negócio.
**Aceitação/testes:** build, lint e teste vazio passam em ambiente limpo; a composição Docker inicia os serviços locais documentados; nenhuma chave real é criada.
**DoD específico:** comandos nativos e Docker documentados; imagens são reproduzíveis e gates verdes.

### TASK-002 — Base de persistência e migrações
**Status:** DONE · **Phase:** PHASE-01 · **Priority:** HIGH
**Objetivo:** Configurar acesso PostgreSQL, migrações e convenções de auditoria temporal.
**Dependências:** `DEPENDS_ON: TASK-001`
**Relacionados:** ADR-002, RNF-009,012.
**Artefatos esperados:** módulo de banco, configuração local e baseline de migração.
**ALLOWED_CHANGES:** `apps/api/src/infrastructure/persistence/**`; `database/**`; `tests/integration/persistence/**`; `TASKS.md`.
**FORBIDDEN_CHANGES:** módulos de domínio; dados reais; serviços externos.
**Aceitação/testes:** migração sobe/desce em banco isolado; conexão e rollback são testados.
**DoD específico:** banco não é acessado diretamente pela camada web.

### TASK-003 — Identidade e confirmação de e-mail
**Status:** DONE · **Phase:** PHASE-01 · **Priority:** CRITICAL
**Objetivo:** Implementar usuários, senha, registro, confirmação e recuperação seguros.
**Dependências:** `DEPENDS_ON: TASK-001, TASK-002`
**Relacionados:** RF-001, RN-001,021, RNF-001–003, ADR-003, ADR-007.
**Artefatos esperados:** identidade, tokens de uso único/expiração e caixa de saída local.
**ALLOWED_CHANGES:** `apps/api/src/modules/identity/**`; `apps/web/src/features/auth/**`; `database/**`; `tests/**identity/**`; `TASKS.md`.
**FORBIDDEN_CHANGES:** autorização de catálogo/comércio; PII em fixtures/logs.
**Aceitação/testes:** e-mail não confirmado não compra; token inválido/expirado falha sem enumeração; reset funciona; seed controlado cria o primeiro Admin; JWT inválido ou expirado é recusado.
**DoD específico:** hash, rate limit e testes de abuso aplicáveis passam.

### TASK-004 — RBAC, auditoria e exclusão solicitada
**Status:** DONE · **Phase:** PHASE-01 · **Priority:** HIGH
**Objetivo:** Criar papéis, guardas de autorização, auditoria e solicitação de desativação.
**Dependências:** `DEPENDS_ON: TASK-003`
**Relacionados:** RF-002,022,023; RN-017,018,021; ADR-003, ADR-007.
**Artefatos esperados:** Admin, Catálogo, Estoquista, Cliente; trilha e solicitação de exclusão.
**ALLOWED_CHANGES:** `modules/identity/**`; `modules/audit/**`; `features/account/**`; `database/**`; `tests/**`; `TASKS.md`.
**FORBIDDEN_CHANGES:** retenção definitiva/legal; 2FA; catálogo e checkout.
**Aceitação/testes:** cada papel recebe negação correta; ação sensível cria auditoria sem PII explícita.
**DoD específico:** motivo obrigatório é imposto em ações definidas.

### TASK-005 — Checkpoint PHASE-01
**Status:** DONE · **Phase:** PHASE-01 · **Priority:** HIGH
**Objetivo:** Validar base, identidade, segurança e rastreabilidade da fase.
**Dependências:** `DEPENDS_ON: TASK-004`
**Relacionados:** RNF-001–003,012.
**Artefatos esperados:** relatório de checkpoint e correções estritamente necessárias.
**ALLOWED_CHANGES:** testes/configuração das fases 01; documentação de qualidade; `TASKS.md`.
**FORBIDDEN_CHANGES:** funcionalidades PHASE-02+.
**Aceitação/testes:** build/lint/unidade/integração/segurança passam; ADRs e matriz conferem.
**DoD específico:** nenhum bloqueador de fundação conhecido.

### TASK-006 — Checkpoint de transição PHASE-01
**Status:** DONE · **Phase:** PHASE-01 · **Priority:** CRITICAL
**Objetivo:** Autorizar formalmente início do catálogo após revalidar dependências.
**Dependências:** `DEPENDS_ON: TASK-001, TASK-002, TASK-003, TASK-004, TASK-005`
**Relacionados:** todos PHASE-01.
**Artefatos esperados:** evidência de gates e atualização de estado.
**ALLOWED_CHANGES:** `TASKS.md`; testes/configuração PHASE-01.
**FORBIDDEN_CHANGES:** código de catálogo ou comércio.
**Aceitação/testes:** ordem e estados validados; todos gates PHASE-01 verdes.
**DoD específico:** TASK-007 pode se tornar READY.

### TASK-007 — Domínio e administração do catálogo
**Status:** DONE · **Phase:** PHASE-02 · **Priority:** CRITICAL
**Objetivo:** Implementar obra, autor, editora, categorias, edição, ISBN, preço e visibilidade.
**Dependências:** `DEPENDS_ON: TASK-006`
**Relacionados:** RF-003–005; RN-002,003.
**Artefatos esperados:** CRUD autorizado e página de catálogo.
**ALLOWED_CHANGES:** `modules/catalog/**`; `features/catalog/**`; `database/**`; `tests/**catalog/**`; `TASKS.md`.
**FORBIDDEN_CHANGES:** arquivos digitais; carrinho; estoque.
**Aceitação/testes:** múltiplas categorias, ISBN válido, versões/preços próprios e ocultação autorizada.
**DoD específico:** filtros básicos e RBAC cobertos.

### TASK-008 — Busca e filtros básicos de catálogo
**Status:** DONE · **Phase:** PHASE-02 · **Priority:** HIGH
**Objetivo:** Entregar pesquisa, filtros disponíveis no catálogo e paginação, sem rankings que dependem de pedidos ou avaliações.
**Dependências:** `DEPENDS_ON: TASK-007`
**Relacionados:** RF-003,004; RN-002; RNF-004,005.
**Artefatos esperados:** consultas por título/autor, categoria, idioma, faixa de preço e lançamento, com paginação.
**ALLOWED_CHANGES:** `modules/catalog/search/**`; `features/catalog/**`; `tests/**catalog/**`; `TASKS.md`.
**FORBIDDEN_CHANGES:** checkout; inventário; regra de avaliações; ranking por vendas ou avaliações.
**Aceitação/testes:** filtros básicos combinam; ocultos não aparecem; vazio é acessível e paginado.
**DoD específico:** consultas relevantes têm índices/revisão de plano.

### TASK-009 — Inventário e ativos privados
**Status:** DONE · **Phase:** PHASE-02 · **Priority:** HIGH
**Objetivo:** Gerir estoque físico, licenças digitais e upload/versionamento privado local.
**Dependências:** `DEPENDS_ON: TASK-007`
**Relacionados:** RF-006,007; RN-003,004; ADR-004.
**Artefatos esperados:** inventário, movimentos, ativo/versionamento e adaptador local privado.
**ALLOWED_CHANGES:** `apps/api/src/modules/catalog/assets/**`; `apps/api/src/modules/inventory/**`; `apps/api/src/storage/**`; `storage/**`; `database/**`; `tests/**`; `docs/testing/TASK-009-*.md`; `prompts/tasks/task-009/**`; `TASKS.md`.
**FORBIDDEN_CHANGES:** endpoint público de download; pedidos.
**Aceitação/testes:** original não é servido publicamente; licença ilimitada/numerada e estoque são validados.
**DoD específico:** mudança gera auditoria apropriada.

### TASK-010 — Wishlist básica
**Status:** DONE · **Phase:** PHASE-02 · **Priority:** HIGH
**Objetivo:** Implementar wishlist básica individual.
**Dependências:** `DEPENDS_ON: TASK-007`
**Relacionados:** RF-008.
**Artefatos esperados:** lista pessoal de obras, com inclusão, remoção e consulta autorizadas.
**ALLOWED_CHANGES:** `apps/api/src/modules/wishlist/**`; `apps/api/src/app.module.ts`; `apps/web/src/features/wishlist/**`; `database/schema.prisma`; `database/migrations/**`; `tests/**wishlist/**`; `tests/manual/task-010/**`; `docs/testing/TASK-010-*.md`; `TASKS.md`.
**FORBIDDEN_CHANGES:** notificações de wishlist; checkout.
**Aceitação/testes:** cliente só vê e altera a própria lista; duplicações e acessos de terceiros são recusados.
**DoD específico:** sem alertas automáticos fora do escopo.

### TASK-011 — Checkpoint PHASE-02
**Status:** DONE · **Phase:** PHASE-02 · **Priority:** CRITICAL
**Objetivo:** Verificar catálogo, busca, inventário e segurança de arquivos.
**Dependências:** `DEPENDS_ON: TASK-007, TASK-008, TASK-009, TASK-010`
**Relacionados:** RF-003–008; RNF-004,010.
**Artefatos esperados:** relatório e evidência de gates.
**ALLOWED_CHANGES:** testes/documentação PHASE-02; `TASKS.md`.
**FORBIDDEN_CHANGES:** carrinho/pedidos.
**Aceitação/testes:** autorizações, índices e não exposição de originais passam.
**DoD específico:** PHASE-03 desbloqueada.

**Conclusão:** concluída em 2026-11-20; gates e testes manuais aprovados pelo responsável. TASK-012 está DONE; TASK-013 fica READY e requer autorização própria para início.

### TASK-012 — Carrinho, cupom e frete
**Status:** DONE · **Phase:** PHASE-03 · **Priority:** CRITICAL
**Objetivo:** Implementar carrinho, cupom global e simulação de frete por CEP/quantidade.
**Dependências:** `DEPENDS_ON: TASK-011`
**Relacionados:** RF-009–011; RN-005,008,009.
**Artefatos esperados:** carrinho híbrido, regras de cupom e configuração de frete.
**ALLOWED_CHANGES:** `apps/api/src/app.module.ts`; `apps/api/src/modules/cart/**`; `apps/api/src/modules/coupons/**`; `apps/api/src/modules/shipping/**`; `apps/api/src/modules/library/ownership/**` (read-only ownership lookup only); `apps/api/src/modules/identity/identity.module.ts`; `apps/api/src/modules/identity/application/services/local-customer-seed.service.ts`; `apps/api/package.json`; `apps/web/src/features/checkout/**`; `apps/web/app/page.tsx`; `apps/web/package.json`; `package.json`; `package-lock.json`; `database/schema.prisma`; `database/migrations/**`; `docker-compose.yml`; `.env`; `.env.example`; `tests/**`; `tests/manual/task-012/**`; `docs/testing/TASK-012-*.md`; `prompts/tasks/task-012/**`; `TASKS.md`.
**FORBIDDEN_CHANGES:** confirmação de pedido; gateway real.
**Aceitação/testes:** um cupom; validade/cota; endereço/CPF; frete somente físico; e-book duplicado é recusado; em Compose local, duas contas CUSTOMER sintéticas configuradas são criadas/atualizadas idempotentemente, sem gravar senha em claro, e o seed não roda em produção.
**DoD específico:** valores usam decimal BRL e são recalculados no servidor; contas CUSTOMER fixas só são habilitadas explicitamente em ambiente local e exigem e-mail `@example.invalid`.
**Conclusão:** GATE-005 e GATE-007 aprovados em 2026-11-20. A atualização compatível da API eliminou as vulnerabilidades de produção; `npm audit --omit=dev` reportou zero vulnerabilidades. Evidências em `docs/testing/TASK-012-planejamento-e-gates.md`.

### TASK-013 — Pedido e checkout transacional
**Status:** DONE · **Phase:** PHASE-03 · **Priority:** HIGH
**Objetivo:** Criar pedido único híbrido, confirmação fictícia e consumo atômico de recursos.
**Dependências:** `DEPENDS_ON: TASK-012`
**Relacionados:** RF-012; RN-004,010,011; ADR-005.
**Artefatos esperados:** pedido, itens, endereço histórico e adaptador de pagamento simulado.
**ALLOWED_CHANGES:** `apps/api/src/app.module.ts` (registro necessário dos módulos); `apps/api/src/modules/orders/**`; `apps/api/src/modules/payments/**`; `database/**`; `tests/unit/orders/**`; `tests/integration/orders/**`; `tests/manual/task-013/**` (roteiro exigido pelo AGENTS.md); `docs/testing/TASK-013-*.md` (plano/relatório sanitizado); `TASKS.md`.
**FORBIDDEN_CHANGES:** gateway externo; biblioteca/download.
**Aceitação/testes:** R$0 pula pagamento; conflito não cria pedido; cupom/estoque/licença não sobrevendem.
**DoD específico:** idempotência e concorrência são testadas.
**Conclusão:** concluída em 2026-11-20 após aprovação do responsável. GATE-001 a GATE-007 aprovados; os quatro cenários manuais passaram e a limpeza foi confirmada. Evidências em `docs/testing/TASK-013-planejamento-e-gates.md` e `docs/testing/TASK-013-testes-manuais-resultado.md`.

### TASK-014 — Notificações e ciclo de pedido
**Status:** DONE · **Phase:** PHASE-03 · **Priority:** CRITICAL
**Objetivo:** Integrar caixa de saída simulada aos eventos de conta e pedido.
**Dependências:** `DEPENDS_ON: TASK-012, TASK-013`
**Relacionados:** RF-020; RN-019; ADR-005.
**Artefatos esperados:** modelos/eventos locais, histórico de entrega simulada e retries observáveis.
**ALLOWED_CHANGES:** `apps/api/src/modules/notifications/**`; `apps/api/src/modules/orders/**`; `apps/api/src/modules/identity/**`; `database/schema.prisma`; `database/migrations/**` (ampliação autorizada pelo responsável para persistir estados de entrega, tentativas e chave de deduplicação); `tests/unit/notifications/**`; `tests/unit/identity/**`; `tests/integration/notifications/**`; `tests/integration/identity/**`; `tests/integration/orders/**` (regressão do fluxo de compra); `tests/manual/task-014/**` (roteiro exigido pelo AGENTS.md); `docs/testing/TASK-014-*.md` (plano/relatório sanitizado); `TASKS.md`.
**FORBIDDEN_CHANGES:** provedor externo; conteúdo PII nos logs.
**Aceitação/testes:** eventos exigidos disparam uma notificação simulada sem duplicação indevida.
**DoD específico:** falha não invalida pedido confirmado.
**Gates:** GATE-001 a GATE-007 aprovados em 2026-11-20. Os três cenários manuais passaram, a limpeza foi confirmada e o responsável aprovou o relatório. Evidências em `docs/testing/TASK-014-planejamento-e-gates.md` e `docs/testing/TASK-014-testes-manuais-resultado.md`.

### TASK-015 — Checkpoint PHASE-03
**Status:** DONE · **Phase:** PHASE-03 · **Priority:** HIGH
**Objetivo:** Validar compra gratuita/paga simulada, híbrida e concorrente.
**Dependências:** `DEPENDS_ON: TASK-014`
**Relacionados:** RF-009–012,020; RNF-009.
**Artefatos esperados:** cenários E2E e relatório.
**ALLOWED_CHANGES:** testes/documentação PHASE-03; `TASKS.md`.
**FORBIDDEN_CHANGES:** biblioteca, bundles e logística.
**Aceitação/testes:** todos cenários de checkout e regressões verdes.
**DoD específico:** não há sobre-venda conhecida.
**Gates:** GATE-001 a GATE-005 aprovados em 2026-11-20. Testes unitários 50/50, integração 8/8, lint e build passaram; cenários manuais 4/4 aprovados e revisados. Evidências em `docs/testing/TASK-015-planejamento-e-gates.md` e `docs/testing/TASK-015-testes-manuais-resultado.md`.
**Conclusão:** checkpoint PHASE-03 aprovado; concorrência de estoque, licença e cupom passou sem sobre-venda conhecida. Incidental: tentativa de reexecução do helper TASK-014 bloqueou antes dos cenários; evidência aprovada e versionada da TASK-014 foi preservada. TASK-016 é a próxima elegível e requer autorização própria para início.

### TASK-016 — Checkpoint de transição PHASE-03
**Status:** DONE · **Phase:** PHASE-03 · **Priority:** CRITICAL
**Objetivo:** Autorizar a entrega digital e regras pós-compra.
**Dependências:** `DEPENDS_ON: TASK-012, TASK-013, TASK-014, TASK-015`
**Relacionados:** PHASE-03.
**Artefatos esperados:** confirmação de dependências/gates.
**ALLOWED_CHANGES:** `TASKS.md`; testes/configuração PHASE-03.
**FORBIDDEN_CHANGES:** novas funcionalidades.
**Aceitação/testes:** checkpoints e rastreabilidade aprovados.
**DoD específico:** TASK-017 torna-se elegível.
**Gates:** GATE-001 a GATE-005 aprovados em 2026-11-20. Os estados `DONE`, planos e relatórios manuais de TASK-012 a TASK-015 foram conferidos; parser do roteiro PowerShell, `git diff --check` e revisão humana passaram. Evidências em `docs/testing/TASK-016-planejamento-e-gates.md` e `docs/testing/TASK-016-testes-manuais-resultado.md`.
**Conclusão:** checkpoint PHASE-03 aprovado pelo responsável; TASK-017 torna-se READY. Nenhuma implementação de PHASE-04 foi iniciada.

### TASK-017 — Biblioteca, download e marca d’água
**Status:** DONE · **Phase:** PHASE-04 · **Priority:** CRITICAL
**Objetivo:** Conceder direitos, gerar cópias personalizadas e links temporários renováveis.
**Dependências:** `DEPENDS_ON: TASK-016`
**Relacionados:** RF-013,014; RN-012; ADR-004.
**Artefatos esperados:** biblioteca, eventos de download, processador PDF/ePub e política de link.
**ALLOWED_CHANGES:** `modules/library/**`; `modules/watermark/**`; `storage/**`; `features/library/**`; `tests/**`; `apps/api/package.json`; `package-lock.json`; `TASKS.md`.
**FORBIDDEN_CHANGES:** DRM; arquivo original público; reembolso.
**Aceitação/testes:** pré-venda bloqueia; cópia leva os três campos; original não é exposto; link expira/renova.
**DoD específico:** teste de PDF/ePub e falha de job observável.
**Decisão de escopo:** em 2026-11-20, o responsável autorizou ampliar `ALLOWED_CHANGES` para `apps/api/package.json` e `package-lock.json` para incluir processadores runtime de PDF/EPUB. `apps/api/src/app.module.ts` será incidental mínimo para registrar o módulo, sem alterar contrato da aplicação.
**Conclusão:** DONE em 2026-11-21 após aprovação humana dos quatro cenários manuais e inspeção da cópia PDF. GATE-001 a GATE-007 aprovados. Testes 59/59; integração 8/8 no banco isolado; lint, build geral, build API e sintaxe PowerShell passaram. Evidências em `docs/testing/TASK-017-planejamento-e-gates.md` e `docs/testing/TASK-017-testes-manuais-resultado.md`. Branch `feature/TASK-017-biblioteca-download-watermark`; commits exclusivos registrados no histórico.

### TASK-018 — Bundles e pré-vendas
**Status:** DONE · **Phase:** PHASE-04 · **Priority:** HIGH
**Objetivo:** Implementar composição, preço proporcional e liberação de pré-vendas físicas/digitais.
**Dependências:** `DEPENDS_ON: TASK-017`
**Relacionados:** RF-015,016; RN-006,007,012,013.
**Artefatos esperados:** agregados/regras de bundle e agenda de lançamento.
**ALLOWED_CHANGES:** `modules/bundles/**`; `modules/preorders/**`; `modules/orders/**`; `modules/library/**`; `modules/cart/**` (integração mínima de carrinho); `database/schema.prisma`; `database/migrations/**`; `apps/api/src/app.module.ts` (registro mínimo dos módulos); `tests/**`; `docs/testing/TASK-018-*.md`; `TASKS.md`.
**FORBIDDEN_CHANGES:** descontos não especificados; expedição antes de lançamento.
**Aceitação/testes:** composição duplicada falha; desconto nunca negativo; todos possuídos bloqueia; liberação só na data.
**DoD específico:** compra de bundle concede cada item separadamente.
**Decisão de escopo:** em 2026-11-20, o responsável aprovou ampliar `ALLOWED_CHANGES` para schema/migrations, integração do carrinho, registro mínimo em `app.module.ts` e relatório `docs/testing/TASK-018-*.md`. A guarda concreta de expedição será aplicada quando o fluxo logístico for criado na TASK-021; até lá, o serviço de pré-vendas expõe a regra temporal comum e a biblioteca a aplica aos downloads digitais.
**Gates:** GATE-001 a GATE-005 APROVADOS. `npm run build`, `npm run lint`, `npm test` (64/64), `npm run test:integration` (9/9), `prisma validate`, sintaxe do runner PowerShell e `git diff --check` passaram. Evidências em `docs/testing/TASK-018-planejamento-e-gates.md`.
**GATE-006:** APROVADO pelo responsável em 2026-11-20 após revisar o relatório. Na execução aprovada, MT-018-01 a MT-018-04 passaram usando as contas ADMIN e os dois CUSTOMER do `.env` contra API isolada em `localhost:3002`/`lumina_task009_test`. Uma repetição posterior foi bloqueada porque as compras sintéticas da execução anterior já haviam alterado a posse das contas; o roteiro e o relatório registram essa condição. Evidências em `docs/testing/TASK-018-testes-manuais-resultado.md` e `tests/manual/task-018/`.
**GATE-007:** APROVADO em 2026-11-20. Definition of Done satisfeita; Scope Guard validado; evidências, gates e commits exclusivos registrados. TASK-018 concluída.
**Prontidão:** READY em 2026-11-20; dependência TASK-017 verificada como DONE, com gates GATE-001 a GATE-007 aprovados e evidências em `docs/testing/TASK-017-planejamento-e-gates.md` e `docs/testing/TASK-017-testes-manuais-resultado.md`. Iniciada após autorização do responsável.
**Conclusão:** DONE em 2026-11-20 após aprovação humana dos quatro cenários manuais. GATE-001 a GATE-007 aprovados; build, lint, testes unitários (64/64), integração (9/9), Prisma validate, parser PowerShell e `git diff --check` passaram. Scope Guard cumprido; sem mudanças incidentais. Commits TASK-018: `dd6317b`, `8746e32`, `3275672`, `0d1fa9b`, `ef21cc0`, `57f8f49`.

## SCOPE ESCALATION
TASK: TASK-018
Necessidade identificada: persistir composição de bundles e ligar a compra do bundle à concessão de cada edição; também documentar o relatório dos testes manuais.
Motivo: o schema atual não possui entidades de bundle e o checkout aceita somente edições no carrinho. O fluxo de logística física ainda não existe; a liberação antecipada precisa ser impedida quando expedição for implementada. O roteiro operacional exige relatório sanitizado em `docs/testing/`.
Arquivos/módulos afetados: `database/schema.prisma`, `database/migrations/**`, `apps/api/src/modules/cart/**`, `apps/api/src/app.module.ts`, `apps/api/src/modules/bundles/**`, `apps/api/src/modules/preorders/**`, `apps/api/src/modules/orders/**`, `apps/api/src/modules/library/**`, `tests/**`, `docs/testing/TASK-018-*.md`.
Allowed Changes atual: `modules/bundles/**`; `modules/preorders/**`; `modules/orders/**`; `modules/library/**`; `tests/**`; `TASKS.md`.
Forbidden Changes relacionado: expedição antes de lançamento; descontos não especificados.
Por que não é incidental: schema/migrations e integração do carrinho alteram contratos e persistência, sendo necessárias para a funcionalidade; relatório em `docs/testing/` está fora dos caminhos permitidos.
Impacto se não realizada: bundles não podem ser compostos e comprados com preço recalculado de forma persistente nem conceder direitos item a item com segurança; a validação manual não consegue cumprir o padrão operacional de evidência.
Alternativas: ampliar `ALLOWED_CHANGES` para schema/migrations e carrinho/registro do módulo e autorizar `docs/testing/TASK-018-*.md`; ou aprovar uma arquitetura alternativa que não exija persistência de bundles e definir como será o relatório manual.
Recomendação: ampliar explicitamente `ALLOWED_CHANGES` para `database/schema.prisma`, `database/migrations/**`, `apps/api/src/modules/cart/**`, `apps/api/src/app.module.ts` (registro mínimo), e `docs/testing/TASK-018-*.md`. Incluir ainda a guarda do lançamento na transição de expedição quando o módulo de logística for introduzido, sem permitir expedição antecipada.
Decisão: APROVADA pelo responsável em 2026-11-20. Escopo ampliado conforme `ALLOWED_CHANGES` acima; a guarda de expedição será implementada na TASK-021 junto ao fluxo logístico, sem permitir expedição antecipada.

### TASK-019 — Cancelamentos e reembolsos
**Status:** DONE · **Phase:** PHASE-04 · **Priority:** HIGH
**Objetivo:** Aplicar regras automáticas digitais e decisão administrativa/estado físico.
**Dependências:** `DEPENDS_ON: TASK-017, TASK-018`
**Relacionados:** RF-018; RN-013–015,017.
**Artefatos esperados:** solicitação, decisão, motivo e reversões transacionais adequadas.
**ALLOWED_CHANGES:** `modules/refunds/**`; `modules/orders/**`; `modules/library/**`; `modules/audit/**`; `database/schema.prisma`; `database/migrations/**`; `tests/**`; `TASKS.md`.
**FORBIDDEN_CHANGES:** gateway real; regras legais não aprovadas.
**Aceitação/testes:** janelas 2h/2 semanas/1 semana; reembolso digital revoga acesso e restaura licença limitada; físico pré-envio e estoque restaurado somente após devolução confirmada; Admin auditado.
**DoD específico:** exceção não permite violar janela sem Admin.
**Prontidão:** READY em 2026-11-20 após confirmação de TASK-017 e TASK-018 como DONE, evidências e gates disponíveis, RN/UC/aceitação/Scope Guard definidos e ADR-003/005 aceitos. Sem pendências bloqueantes; o responsável autorizou a promoção para READY e início.
**Gates:** GATE-001 a GATE-007 APROVADOS em 2026-11-21. Build completo, lint, Prisma validate, testes unitários (69/69), integração (10/10), sintaxe PowerShell e diff check passaram. Quatro cenários manuais aprovados pelo responsável; verificação suplementar confirmou reposição de estoque e movimento físico. Scope Guard e DoD validados. Evidências em `docs/testing/TASK-019-planejamento-e-gates.md` e `docs/testing/TASK-019-testes-manuais-resultado.md`.
**Decisão de cálculo:** desconto do cupom será rateado proporcionalmente entre linhas, com distribuição determinística dos centavos restantes; frete não integra o reembolso. Decisão aprovada pelo responsável em 2026-11-20.
**Plano GATE-003:** adicionar registro persistente por linha de pedido com quantidade, valor, solicitante, decisão, estado, motivos e timestamps; estado de fulfillment no pedido (`NOT_REQUIRED`, `PENDING`, `PICKING`, `SHIPPED`, `DELIVERED`) e trilha de retorno no reembolso, compatíveis com TASK-021; estado/valor reembolsado no pagamento e movimento de reposição física. Rotas do cliente solicitam cancelamento; Admin decide exceções/físicos e confirma devolução. Operações de auditoria, reembolso e estoque/licença usam a mesma transação com locks e idempotência. Biblioteca e pedidos excluem direitos já reembolsados; link temporário emitido anteriormente volta a validar o direito antes de entregar a cópia. Cobertura: regras unitárias, integração com banco sintético e roteiro manual PowerShell com relatório sanitizado.
**Conclusão:** DONE após aprovação humana e revisão final em 2026-11-21. Commits exclusivos: `dca7453`, `d381df2`, `349a078`, `84e467f`, `8537ced`, `a3dbcee`, `a8a7fb8`, `ef6d2e7`, `bd1f7ef`. Mudanças primárias autorizadas em orders/refunds/library/audit, schema/migrations e testes; documentação de evidências em `docs/testing/` incidental mínima, exigida por `AGENTS.md`. Nenhuma mudança proibida. TASK-020 continua aguardando autorização própria.

## SCOPE ESCALATION
TASK: TASK-019
Necessidade identificada: persistir solicitações/decisões/reembolsos por item, revogação de acesso, reversões idempotentes de licença/estoque e estado de envio/devolução física.
Motivo: `OrderStatus` possui somente `CONFIRMED`, `PaymentStatus` somente `APPROVED`/`NOT_REQUIRED`; não há modelo de refund, lifecycle de OrderItem nem estado de expedição/devolução. TASK-021 (logística) ainda está bloqueada e depende do checkpoint TASK-020. Implementar só com logs de auditoria ou apagando OrderItem deixa o pagamento aparentemente aprovado, perde histórico da compra e pode impedir idempotência/controle de licença.
Arquivos/módulos afetados: `database/schema.prisma`, `database/migrations/**`; potencial estado mínimo de fulfillment integrado entre `apps/api/src/modules/orders/**`, `apps/api/src/modules/refunds/**` e futura `apps/api/src/modules/logistics/**`.
Allowed Changes atual: `modules/refunds/**`; `modules/orders/**`; `modules/library/**`; `modules/audit/**`; `tests/**`; `TASKS.md`.
Forbidden Changes relacionado: gateway real; regras legais não aprovadas.
Por que não é incidental: altera persistência e contrato de ciclo de vida de pagamentos, itens comprados e expedição física, exigindo migração e regra compartilhada com logística.
Impacto se não realizada: não é possível cumprir com segurança revogação/restauração de direitos, impedir dupla restituição, manter rastreabilidade financeira nem distinguir pedido físico pré-envio de pedido enviado/devolvido.
Alternativas: (A) ampliar `ALLOWED_CHANGES` para `database/schema.prisma` e `database/migrations/**` e aprovar a definição do estado mínimo de fulfillment/retorno a ser consumido pela TASK-021; (B) implementar somente reembolsos digitais agora e revisar a aceitação/dependências da TASK-019 para mover reembolsos físicos à TASK-021, evitando ciclo no grafo de tarefas.
Recomendação: alternativa A, com um registro transacional de refund e estado mínimo compatível com a logística futura; manter gateway simulado e sem criar regras legais novas.
Decisão: APROVADA pelo responsável (alternativa A) em 2026-11-20. Escopo ampliado para `database/schema.prisma`, `database/migrations/**` e estado mínimo de fulfillment/retorno compatível com consumo futuro pela TASK-021. Pagamentos permanecem simulados; sem gateway real nem novas regras legais.

### TASK-020 — Checkpoint PHASE-04
**Status:** DONE · **Phase:** PHASE-04 · **Priority:** CRITICAL
**Objetivo:** Validar ciclo digital completo e pós-compra.
**Dependências:** `DEPENDS_ON: TASK-017, TASK-018, TASK-019`
**Relacionados:** RF-013–018; RNF-010.
**Artefatos esperados:** E2E de biblioteca/bundle/pré-venda/reembolso e relatório.
**ALLOWED_CHANGES:** testes/documentação PHASE-04; `TASKS.md`.
**FORBIDDEN_CHANGES:** logística, avaliações e painéis.
**Aceitação/testes:** originais protegidos, regras temporais e reversões passam.
**DoD específico:** PHASE-05 desbloqueada.
**Prontidão:** READY em 2026-11-21 após confirmar TASK-017, TASK-018 e TASK-019 como DONE, relatórios e gates predecessores existentes, critérios/Scope Guard definidos e ADR-003/004/005 aceitos. Iniciada após autorização do responsável.
**Gates:** GATE-001 a GATE-005 APROVADOS em 2026-11-21. Build, lint, Prisma validate, testes unitários (70/70), integração (10/10 no banco isolado `lumina_task009_test`), parser PowerShell e diff check passaram. O responsável aprovou a revisão manual consolidada de MT-020-01 a MT-020-05 em 2026-11-21; relatório em `docs/testing/TASK-020-testes-manuais-resultado.md`.
**Conclusão:** DONE em 2026-11-21. Critérios e DoD satisfeitos; originais protegidos, regras temporais e reversões validados; PHASE-05 desbloqueada. Mudanças primárias limitadas a teste/documentação PHASE-04 e `TASKS.md`; nenhuma incidental; nenhuma alteração proibida. Commits exclusivos: `aa6e06a`, `59c78c5`, `1424a2c` e commit final de conclusão.

### TASK-021 — Estoque e logística física
**Status:** DONE · **Phase:** PHASE-05 · **Priority:** HIGH
**Objetivo:** Entregar movimentos, alertas e estados/rastreio manuais para o Estoquista.
**Dependências:** `DEPENDS_ON: TASK-020`
**Relacionados:** RF-007,017; RN-004,012,015.
**Artefatos esperados:** transições de expedição, rastreio livre e indicadores físicos.
**ALLOWED_CHANGES:** `modules/inventory/**`; `modules/logistics/**`; `modules/reporting/warehouse/**`; `features/warehouse/**`; `apps/api/src/modules/notifications/notification-event.ts` (extensão mínima para evento de transição logística, aprovada pelo responsável em 2026-11-21); `tests/**`; `TASKS.md`.
**FORBIDDEN_CHANGES:** transportadoras; preço/catálogo pelo Estoquista.
**Aceitação/testes:** somente estoquista/Admin altera físico; transições inválidas e pré-venda antecipada falham.
**DoD específico:** cada status relevante notifica cliente.
**Gates:** GATE-001 a GATE-005 aprovados. GATE-005: build API/web, lint, testes unitários (76/76), integração (10/10 no `lumina_task009_test`), Prisma validate, sintaxe Node/PowerShell e `git diff --check` passaram. GATE-006: cenários MT-021-00 a MT-021-05 aprovados pelo roteiro automatizado em API local e banco isolado; revisão humana aprovada pelo responsável em 2026-11-21. Relatório em `docs/testing/TASK-021-testes-manuais-resultado.md`. GATE-007 aprovado em 2026-11-21: DoD satisfeita, Scope Guard validado; nenhuma alteração proibida ou incidental além do relatório manual exigido por `AGENTS.md`.
**Prontidão:** READY em 2026-11-21 após TASK-020 DONE, dependência validada, requisitos/aceitação/testes/Scope Guard definidos e ADR-005 aceito. Iniciada em branch própria após autorização do responsável. O responsável aprovou em 2026-11-21 a ampliação mínima de ALLOWED_CHANGES para `apps/api/src/modules/notifications/notification-event.ts`, exclusivamente para adicionar evento específico de atualização logística. TASK-021 iniciada em branch própria e concluída após revisão humana aprovada em 2026-11-21. Commits exclusivos: `56fec72`, `09bbeb1` e `c91e10d`; relatório manual em `docs/testing/TASK-021-testes-manuais-resultado.md`.

### TASK-022 — Avaliações, denúncia e moderação
**Status:** DONE · **Phase:** PHASE-05 · **Priority:** HIGH
**Objetivo:** Disponibilizar avaliação publicada, denúncia e remoção auditada.
**Dependências:** `DEPENDS_ON: TASK-020`
**Relacionados:** RF-019,022; RN-016,017.
**Artefatos esperados:** reviews, reports e moderação Admin.
**ALLOWED_CHANGES:** `modules/reviews/**`; `features/reviews/**`; `modules/audit/**`; `apps/api/src/modules/catalog/**` (integração mínima da média visível, autorizada pelo responsável em 2026-11-21); `database/schema.prisma`; `database/migrations/**` (autorizado pelo responsável em 2026-11-21); `tests/**`; `tests/manual/task-021/manual-environment.mjs` e `tests/manual/task-021/prepare-task-021-manual.mjs` (expansão mínima autorizada pelo responsável em 2026-11-21 para desbloquear o lint global); `TASKS.md`.
**FORBIDDEN_CHANGES:** aprovação prévia obrigatória; alteração de regras de compra.
**Aceitação/testes:** só adquirente cria; qualquer usuário denuncia; remoção exige motivo/auditoria.
**DoD específico:** catálogo calcula média somente de avaliações visíveis.
**Prontidão:** READY em 2026-11-21 após confirmar TASK-020 DONE e seus gates/relatório, RF-019/RF-022, RN-016/RN-017, aceitação, testes, Scope Guard e ADR-003 aceito. O responsável autorizou ampliar `ALLOWED_CHANGES` para `database/schema.prisma` e `database/migrations/**` em 2026-11-21, pois o schema não possuía persistência de avaliações/denúncias, e para `apps/api/src/modules/catalog/**` para retornar agregados de avaliações visíveis ao catálogo. Iniciada em branch própria após autorização.
**Progresso:** API, persistência, agregados do catálogo e migração implementados. Auditoria sanitiza PII/credenciais no motivo textual. O responsável autorizou em 2026-11-21 a expansão mínima para corrigir dois erros preexistentes de lint em scripts manuais da TASK-021. Build, lint, Prisma validate, testes automatizados locais (83/83), integração (11/11) e roteiro manual sanitizado (8/8) passaram. A migração foi aplicada somente ao banco isolado `lumina_task009_test`; o responsável revisou e aprovou o relatório manual em 2026-11-22. Relatórios e roteiro: `docs/testing/TASK-022-planejamento-e-gates.md`, `docs/testing/TASK-022-testes-manuais-resultado.md` e `tests/manual/task-022/run-task-022-manual-tests.ps1`. A alteração de uma linha na tabela de APIs do README é incidental, para manter o contrato documentado. Commits da TASK: `3e8fb02`, `e4c5737`, `6e76fdf`.

### TASK-023 — Painéis e relatórios essenciais
**Status:** DONE · **Phase:** PHASE-05 · **Priority:** HIGH
**Objetivo:** Exibir indicadores confirmados com isolamento por papel.
**Dependências:** `DEPENDS_ON: TASK-020, TASK-021`
**Relacionados:** RF-021; RF-023 (somente autorização por papel); RN-020,021; UC-021; RNF-002,003; ADR-001,003,007 (`ACCEPTED`).
**Artefatos esperados:** endpoints e interfaces dos painéis Admin, Catálogo e Estoque; testes de agregação, autorização e estados vazios.
**ALLOWED_CHANGES:** `apps/api/src/modules/reporting/**`; `apps/web/app/**`; `apps/web/src/features/dashboard/**`; `apps/web/src/features/warehouse/**` (integração mínima do painel existente); `tests/**`; `docs/testing/TASK-023-*` (planejamento e relatório manual sanitizado); `TASKS.md`.
**FORBIDDEN_CHANGES:** exportação avançada; gestão de usuários; mudança nas regras de pedidos, reembolsos, cupons ou estoque; schema/migrações; dados fora do papel ou PII de clientes nas respostas.
**Aceitação/testes:**
- Admin consulta `/admin/dashboard` com indicadores históricos: valor líquido pago (`Payment.amountCents - Payment.refundedCents`), clientes com `role=CUSTOMER` e `isActive=true`, todos os pedidos confirmados registrados e Top 5 obras por unidades líquidas. Pedidos gratuitos contam como pedidos/unidades confirmados; reembolsos processados reduzem valor e unidades sem remover o pedido histórico. Top 5 agrega formatos por obra e desempata por título e ID.
- Catálogo consulta `/catalog/dashboard`: licenças digitais alocadas/disponíveis; capacidade `null` ou inventário ausente conserva a semântica existente de ilimitado; alertar quando capacidade finita está esgotada. Cupons considerados são ativos, dentro da validade (`validFrom <= agora < validUntil`) e com cota restante; exibir uso/cota acumulados (`usageCount`/`maxUses`).
- Estoque consulta `/warehouse/dashboard` com o resumo operacional atual: contagens de pedidos físicos por status, unidades em estoque e alertas de estoque zerado/não configurado. Não criar limiar novo de estoque baixo. Preservar `GET /admin/warehouse/summary` para compatibilidade.
- Acesso: Admin consulta os três painéis; `CATALOG` somente `/catalog/dashboard`; `STOCK` somente `/warehouse/dashboard`; visitante recebe 401 e `CUSTOMER` recebe 403. Respostas contêm somente agregados necessários ao papel, sem dados pessoais de clientes.
- Testes unitários cobrem fórmulas, reembolsos parciais/totais, pedido gratuito, agregação por obra, Top 5/empate, cupons válidos/inválidos, licenças finitas/ilimitadas/esgotadas, estoque zero/não configurado e dados vazios. Testes de integração cobrem os três endpoints, ausência de PII, autorização por papel e compatibilidade da rota de estoque existente. Aceitação manual cobre painel e estado vazio para cada papel, usando dados sintéticos via `tests/manual/task-023/run-task-023-manual-tests.ps1`; relatório sanitizado em `docs/testing/` deve ser revisado por pessoa.
**DoD específico:** painéis exibem somente indicadores essenciais autorizados; valores de receita e unidades respeitam pagamentos e reembolsos processados; respostas não expõem PII nem alteram regras de negócio.
**Prontidão:** READY em 2026-11-22 após TASK-020 e TASK-021 confirmadas `DONE`; relatório de gates e resultado manual de TASK-020 e resultado manual aprovado de TASK-021 verificados; RF-021, RN-020/021, UC-021, RNF-002/003 e ADR-001/003/007 revisados. Fórmulas, papéis, endpoints, Scope Guard e matriz de testes definidos. RF-023 limita-se à autorização dos painéis; gestão de usuários fica fora do escopo. Os campos necessários já existem; nenhuma migração é prevista. Baseline nesta branch: lint aprovado, smoke/unit 83/83 e build aprovado após limpar cache Next.js ignorado; `git diff --check` aprovado. GATE-001, GATE-002 e GATE-003 aprovados.
**Execução:** IN_REVIEW em 2026-11-22 na branch `feature/TASK-023-paineis-relatorios`. Implementação concluída e revisada dentro de `ALLOWED_CHANGES`; nenhum schema/migration alterado. GATE-004 aprovado. GATE-005 aprovado: lint, build, testes unitários (87/87), integração (12/12), `node --check` do teste de integração, validação sintática PowerShell e `prisma validate`; `git diff --check` aprovado. Integração executada no banco isolado `lumina_task009_test`. GATE-006 aprovado quanto ao roteiro completo em `tests/manual/task-023/README.md` e script validado sintaticamente; cenários permanecem `NAO EXECUTADO`, conforme requerido pela etapa, sem execução humana presumida. GATE-007 registra a conclusão rastreável; TASK permanece `IN_REVIEW` aguardando execução HTTP com credenciais sintéticas e revisão humana dos cenários UI, além do relatório sanitizado em `docs/testing/TASK-023-testes-manuais-resultado.md`. Sem commits de implementação ainda nesta atualização.

**Validação HTTP (2026-11-22):** preparador `tests/manual/task-023/prepare-and-run.mjs` cria quatro contas sintéticas e obtém tokens por login real em memória; banco isolado criado e migrado. Roteiro HTTP aprovado 7/7; relatório em `docs/testing/TASK-023-testes-manuais-resultado.md`. Commits anteriores: `89be98f` e `e4fe1e0`. Estado continua `IN_REVIEW`: revisão humana da UI e do relatório pendente. Mudanças primárias autorizadas em testes, relatório e rastreabilidade; nenhuma incidental.

**Conclusão (2026-11-22):** responsável confirmou nesta conversa a execução e aprovação dos seis cenários visuais MT-023-UI-01 a MT-023-UI-06 e aprovou o relatório HTTP 7/7. TASK-023 DONE; GATE-001 a GATE-007 aprovados, DoD satisfeita. Evidência humana registrada no relatório sanitizado. Commits: `163e69a`, `89be98f`, `e4fe1e0`, `904d8b1`, mais commit de encerramento. Alterações primárias autorizadas; nenhuma incidental ou proibida. TASK-024 tornou-se READY após definir indicadores, critérios de alerta e Scope Guard.

### TASK-028 — Rotas e navegação dos painéis da equipe
**Status:** DONE · **Phase:** PHASE-05 · **Priority:** HIGH
**Objetivo:** Corrigir o 404 web e garantir navegação funcional entre os painéis administrativos, de catálogo e de estoque.
**Dependências:** `DEPENDS_ON: TASK-023`
**Relacionados:** RF-021, RF-023; RN-020, RN-021; UC-021; RNF-002,005.
**Artefatos esperados:** rotas web dos três painéis, sessão de equipe compartilhada durante navegação cliente, testes e evidências da correção.
**ALLOWED_CHANGES:** `apps/web/app/**`; `apps/web/src/features/dashboard/**`; `tests/**`; `tests/manual/task-028/**`; `docs/testing/TASK-028-*`; `TASKS.md`.
**FORBIDDEN_CHANGES:** alterar contratos/endpoints da API; alterar autorização no backend; persistir sessão/token após recarga; incluir telas de áreas fora dos painéis da equipe.
**Aceitação/testes:** `/dashboard` abre o painel Admin; `/catalog/dashboard`, `/warehouse/dashboard` e `/operations/dashboard` são páginas web e carregam seus indicadores; links do painel atualizam URL e fazem a chamada API esperada; Admin acessa os quatro painéis, CATALOG somente Catálogo, STOCK somente Estoque; acesso incompatível exibe negação sem solicitar endpoint protegido; sessão é preservada entre navegações client-side, encerrada ao sair e não restaurada após reload; estados de loading, vazio, erro HTTP e falha de conexão têm feedback visível. Validar build, lint, testes definidos nos scripts e fluxo manual sintético.
**DoD específico:** nenhuma rota de painel retorna o 404 web observado; endpoints e payloads da API permanecem inalterados.
**Prontidão:** TASK-023 DONE e seus endpoints/contratos verificados. O screenshot do responsável comprova 404 em `http://localhost:3000/catalog/dashboard`; inspeção confirmou que o frontend definia somente `/` e `/dashboard`, enquanto os três painéis existiam apenas como endpoints ou seção interna. Após a primeira validação, o responsável solicitou explicitamente rota própria para Operação. Critérios, papéis, limites e Scope Guard definidos. Nenhuma migração necessária.
**Conclusão (2026-11-22):** responsável confirmou nesta conversa que todos os fluxos visuais da TASK-028 funcionam corretamente; revisão humana MT-028-UI-01 a MT-028-UI-06 aprovada e registrada no relatório sanitizado. TASK-028 DONE; GATE-001 a GATE-007 aprovados; DoD satisfeita. Build web local/Docker lista as quatro rotas; `npm run lint` aprovado; `npm test` 95/95 (teste de navegação 2/2); roteiro HTTP 8/8 (quatro páginas e 44 assets HTTP 200). Testes de integração de API não executados porque a TASK não alterou contratos/backend e `TASK009_TEST_DATABASE_URL` não está configurada; cobertura da API já consta na TASK-023. Mudanças primárias dentro de `ALLOWED_CHANGES`; sem mudança incidental ou proibida. Commits: `5b7d815`, `c813909`; rastreabilidade e status atualizados em commits posteriores da tarefa.

### TASK-024 — Privacidade operacional e observabilidade
**Status:** DONE · **Phase:** PHASE-05 · **Priority:** HIGH
**Objetivo:** Completar solicitação de exclusão, avisos, auditoria e monitoramento técnico.
**Dependências:** `DEPENDS_ON: TASK-020`
**Relacionados:** RF-002,020,022; RN-017–019; RNF-003,007,008; PD-002.
**Artefatos esperados:** fluxo de desativação/reativação durante período configurável, alertas e dashboards técnicos.
**ALLOWED_CHANGES:** `apps/api/src/modules/identity/**` (configuração do prazo e ciclo de reativação); `apps/api/src/modules/audit/**` (sanitização de falhas); `apps/api/src/modules/observability/**` (resumo técnico); `apps/web/src/features/dashboard/**` (seção Admin Operação); `tests/**`; `tests/manual/task-024/**`; `docs/testing/TASK-024-*` (planejamento e relatório sanitizado); `README.md` (contrato do endpoint e configuração do prazo); `TASKS.md`.
**FORBIDDEN_CHANGES:** declarar conformidade legal total; eliminação definitiva sem política aprovada.
**Aceitação/testes:** `ACCOUNT_DELETION_GRACE_PERIOD_DAYS` aceita inteiro positivo e usa 30 dias quando ausente; solicitação desativa e notifica cliente/Admin; reativação funciona dentro do prazo e é recusada após o vencimento sem excluir dados; endpoint `/admin/observability/dashboard` protegido por Admin agrega saúde da API/banco, outbox por estado e solicitações de exclusão pendentes/vencidas/próxima data, sem PII; alerta quando há notificações `FAILED` ou lease `PROCESSING` vencido; demais papéis recebem 403 e visitante 401; logs não contêm PII nem detalhes brutos de exceção. Testes unitários, integração e roteiro manual sintético.
**DoD específico:** PD-002 permanece visível como limite.
**Prontidão:** READY em 2026-11-22 após decisão do responsável sobre indicadores do painel Admin (saúde, notificações e solicitações agregadas sem PII), critérios de alerta, configuração do prazo e atualização do Scope Guard para caminhos reais; TASK-020 DONE e ADR-003 ACCEPTED verificados. Sem alteração de schema/migração; PD-002 permanece como limite.
**Conclusão (2026-11-22):** responsável aprovou MT-024-UI-01 a MT-024-UI-03 nesta conversa; aprovação humana registrada em `docs/testing/TASK-024-testes-manuais-resultado.md`. TASK-024 DONE; GATE-001 a GATE-007 aprovados; DoD satisfeita. GATE-005: build, lint, `npm test` (93/93), integração (13/13 em `lumina_task009_test`), sintaxe Node/PowerShell e `git diff --check` aprovados. GATE-006: roteiro sintético HTTP/API 7/7 aprovado e revisão visual 3/3 aprovada pelo responsável. Mudança incidental: registro do novo módulo em `apps/api/src/app.module.ts`, necessário para expor o endpoint. Sem migração ou mudança proibida. PD-002 permanece como limite explícito; `npm run format:check` não é gate definido e sua falha basal em 200 arquivos não foi corrigida por formatação global. Commits de implementação: `893ed7b`, `78ec7e0`; commit de encerramento registra aprovação e estado final.

### TASK-027 — Rankings de descoberta pós-venda
**Status:** IN_REVIEW · **Phase:** PHASE-05 · **Priority:** HIGH
**Objetivo:** Entregar os filtros de catálogo que dependem de dados consolidados de pedidos e avaliações.
**Dependências:** `DEPENDS_ON: TASK-022, TASK-023`
**Relacionados:** RF-003,019; RN-016; RNF-011.
**Artefatos esperados:** ordenação/filtro por mais vendidos e bem avaliados, integrados à busca de catálogo existente.
**ALLOWED_CHANGES:** `apps/api/src/modules/catalog/search/**`; `apps/api/src/modules/catalog/presentation/**` (parâmetros de consulta de `GET /works`); `apps/web/app/page.tsx` (controles mínimos de ordenação); `tests/unit/catalog/**`; `tests/integration/catalog/**`; `tests/manual/task-027/**`; `docs/testing/TASK-027-*`; `README.md` (contrato de consulta de `GET /works`); `TASKS.md`.
**FORBIDDEN_CHANGES:** alterar regras de pedidos/reembolsos ou avaliações, fórmulas/visibilidade de avaliações; criar métricas administrativas; `database/schema.prisma` e `database/migrations/**` sem scope escalation e autorização explícita.
**Aceitação/testes:** `GET /works?sort=BEST_SELLING|TOP_RATED`; omissão mantém a ordenação atual e valor inválido retorna 400. Ordenação compõe com busca, categoria, idioma, faixa de preço e lançamento, e é aplicada antes de paginação; obras ocultas continuam excluídas. Mais vendidos reutiliza a regra TASK-023: pedidos historicamente confirmados (`CONFIRMED`, `PARTIALLY_REFUNDED`, `REFUNDED`) menos unidades de reembolsos `PROCESSED`, com zero unidades no fim; empate por título e ID. Melhor avaliados usa média apenas de avaliações visíveis; sem avaliações fica por último e empates usam título e ID; não criar mínimo de avaliações. Resposta preserva a forma atual de itens/paginação e agregados `averageRating`/`reviewCount`. Testar composição de filtros, paginação, empate, reembolso, avaliação removida, estados vazios, papéis públicos e validação do parâmetro.
**DoD específico:** ranking estável e paginado; plano de execução analisado em banco isolado e evidência registra os índices efetivamente utilizados. Se for necessário adicionar índice ou migração, pausar e emitir scope escalation antes de editar schema/migrations.
**Prontidão:** reavaliada em 2026-11-22 após TASK-022 e TASK-023 DONE; seus gates e relatórios foram localizados. Caminhos do código e testes corrigidos para a estrutura real. RF-003, RN-016, RNF-011, UC-003 e ADR-001/003 conferidos. Parâmetros, desempates, refund semantics, filtros, paginação e estados vazios definidos. Sem decisão bloqueante e sem migração prevista; análise do plano de execução faz parte da implementação, e qualquer índice novo exige scope escalation.
**Execução:** IN_PROGRESS em 2026-11-22 na branch `feature/TASK-027-rankings-descoberta`, iniciada após commit de prontidão `4a1197d`. GATE-001 a GATE-003 aprovados; implementação e gates restantes em andamento.

**Revisão (2026-11-22):** implementação concluída na branch própria. `GET /works` aceita `BEST_SELLING` e `TOP_RATED`, preserva a ordenação existente sem parâmetro, combina os filtros atuais antes da paginação, rejeita valor inválido com 400 e mantém a forma de resposta e agregados de avaliações visíveis. Interface da página inicial inclui ordenação, estados de carregamento/erro/vazio e agregados de avaliação. README e roteiro manual atualizados. GATE-004 e GATE-005 aprovados: `npm test` 96/96; lint; build API e Web; integração 1/1 no banco isolado `lumina_task009_test`; sintaxe dos scripts e `git diff --check`. GATE-006: roteiro HTTP 5/5 aprovado; relatório `docs/testing/TASK-027-testes-manuais-resultado.md`; revisão visual MT-027-UI-01 pendente do responsável. `EXPLAIN` no banco isolado usou o índice existente de reembolsos; varreduras sequenciais nas tabelas pequenas; nenhuma migração necessária. Escopo integralmente `PRIMARY` autorizado; sem mudança incidental/proibida. TASK fica `IN_REVIEW` até aprovação visual. Detalhes em `docs/testing/TASK-027-planejamento-e-gates.md` e `tests/manual/task-027/README.md`.

### TASK-025 — Acessibilidade, responsividade e desempenho
**Status:** BLOCKED · **Phase:** PHASE-05 · **Priority:** HIGH
**Objetivo:** Validar meta WCAG A, navegadores, layouts e tempo de carregamento.
**Dependências:** `DEPENDS_ON: TASK-021, TASK-022, TASK-023, TASK-024, TASK-027`
**Relacionados:** RNF-004–006.
**Artefatos esperados:** testes automatizados/manuais e correções localizadas.
**ALLOWED_CHANGES:** `apps/web/**`; `tests/e2e/**`; `tests/accessibility/**`; `docs/architecture/**`; `TASKS.md`.
**FORBIDDEN_CHANGES:** alteração de regra de negócio; redesign não necessário.
**Aceitação/testes:** teclado, rótulos, contraste, mobile e navegadores-alvo passam; medição registrada.
**DoD específico:** qualquer meta não medida é marcada como falha, não presumida.

### TASK-026 — Checkpoint final V1
**Status:** BLOCKED · **Phase:** PHASE-05 · **Priority:** CRITICAL
**Objetivo:** Validar V1 integralmente contra requisitos, segurança, documentação e Scope Guard.
**Dependências:** `DEPENDS_ON: TASK-021, TASK-022, TASK-023, TASK-024, TASK-025, TASK-027`
**Relacionados:** todos RF/RN/RNF/UC/ADR.
**Artefatos esperados:** relatório final de release, matriz atualizada e riscos/pendências revisados.
**ALLOWED_CHANGES:** testes, documentação, configuração de qualidade e `TASKS.md`.
**FORBIDDEN_CHANGES:** funcionalidades fora de escopo; infraestrutura/integrações reais.
**Aceitação/testes:** gates completos, rastreabilidade, backup/restore ensaiado e testes de regressão aprovados.
**DoD específico:** V1 elegível para revisão humana; PD-001–003 explicitamente aceitos ou bloqueiam publicação.
`n<!-- TASK-023: atualização de execução em 2026-11-22. Preparador tests/manual/task-023/prepare-and-run.mjs cria quatro contas sintéticas e obtém tokens por login real em memória; banco isolado criado/migrado. Roteiro HTTP aprovado 7/7, relatório docs/testing/TASK-023-testes-manuais-resultado.md. Commits anteriores 89be98f e e4fe1e0. Estado continua IN_REVIEW: revisão humana da UI e do relatório pendente. Mudanças primárias autorizadas em tests/**, docs/testing/TASK-023-* e TASKS.md; nenhuma incidental. -->
