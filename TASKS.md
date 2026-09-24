# Backlog executável

Estados: `BLOCKED | READY | IN_PROGRESS | IN_REVIEW | DONE | FAILED | CANCELLED`. A ordem abaixo é topológica; apenas a primeira TASK elegível pode iniciar.

| Ordem | TASK | Fase | Prioridade | Dependências | Estado |
|---:|---|---|---|---|---|
| 1 | TASK-001 | PHASE-01 | CRITICAL | NONE | READY |
| 2 | TASK-002 | PHASE-01 | HIGH | 001 | BLOCKED |
| 3 | TASK-003 | PHASE-01 | CRITICAL | 001,002 | BLOCKED |
| 4 | TASK-004 | PHASE-01 | HIGH | 003 | BLOCKED |
| 5 | TASK-005 | PHASE-01 | HIGH | 004 | BLOCKED |
| 6 | TASK-006 | PHASE-01 | CRITICAL | 001–005 | BLOCKED |
| 7 | TASK-007 | PHASE-02 | CRITICAL | 006 | BLOCKED |
| 8 | TASK-008 | PHASE-02 | HIGH | 007 | BLOCKED |
| 9 | TASK-009 | PHASE-02 | HIGH | 007 | BLOCKED |
| 10 | TASK-010 | PHASE-02 | HIGH | 008,009 | BLOCKED |
| 11 | TASK-011 | PHASE-02 | CRITICAL | 007–010 | BLOCKED |
| 12 | TASK-012 | PHASE-03 | CRITICAL | 011 | BLOCKED |
| 13 | TASK-013 | PHASE-03 | HIGH | 012 | BLOCKED |
| 14 | TASK-014 | PHASE-03 | CRITICAL | 012,013 | BLOCKED |
| 15 | TASK-015 | PHASE-03 | HIGH | 014 | BLOCKED |
| 16 | TASK-016 | PHASE-03 | CRITICAL | 012–015 | BLOCKED |
| 17 | TASK-017 | PHASE-04 | CRITICAL | 016 | BLOCKED |
| 18 | TASK-018 | PHASE-04 | HIGH | 017 | BLOCKED |
| 19 | TASK-019 | PHASE-04 | HIGH | 017,018 | BLOCKED |
| 20 | TASK-020 | PHASE-04 | CRITICAL | 017–019 | BLOCKED |
| 21 | TASK-021 | PHASE-05 | HIGH | 020 | BLOCKED |
| 22 | TASK-022 | PHASE-05 | HIGH | 020 | BLOCKED |
| 23 | TASK-023 | PHASE-05 | HIGH | 020 | BLOCKED |
| 24 | TASK-024 | PHASE-05 | HIGH | 020 | BLOCKED |
| 25 | TASK-025 | PHASE-05 | HIGH | 021–024 | BLOCKED |
| 26 | TASK-026 | PHASE-05 | CRITICAL | 021–025 | BLOCKED |

## Políticas comuns

Todo item abaixo herda `INCIDENTAL_CHANGES_POLICY: MINIMAL_DIRECTLY_CAUSED_CHANGES_ALLOWED`, salvo indicação contrária. Cada TASK exige testes definidos, atualização do próprio estado em `TASKS.md` e DoD global de `AGENTS.md`. Mudanças incidentais devem constar do relatório; se não existirem: `Incidental Changes: NONE`.

### TASK-001 — Inicializar estrutura e qualidade
**Status:** READY · **Phase:** PHASE-01 · **Priority:** CRITICAL
**Objetivo:** Criar estrutura da stack decidida, ferramentas de build/lint/teste e convenções mínimas.
**Dependências:** `DEPENDS_ON: NONE`
**Relacionados:** ADR-001, ADR-002, RNF-012.
**Artefatos esperados:** projetos web/API, configuração de qualidade e instruções de execução.
**ALLOWED_CHANGES:** arquivos-raiz de build; `apps/**`; `packages/**`; `tests/**`; `TASKS.md`.
**FORBIDDEN_CHANGES:** requisitos/ADRs; integrações externas; regras de negócio.
**Aceitação/testes:** build, lint e teste vazio passam em ambiente limpo; nenhuma chave real é criada.
**DoD específico:** comandos documentados e gates verdes.

### TASK-002 — Base de persistência e migrações
**Status:** BLOCKED · **Phase:** PHASE-01 · **Priority:** HIGH
**Objetivo:** Configurar acesso PostgreSQL, migrações e convenções de auditoria temporal.
**Dependências:** `DEPENDS_ON: TASK-001`
**Relacionados:** ADR-002, RNF-009,012.
**Artefatos esperados:** módulo de banco, configuração local e baseline de migração.
**ALLOWED_CHANGES:** `apps/api/src/infrastructure/persistence/**`; `database/**`; `tests/integration/persistence/**`; `TASKS.md`.
**FORBIDDEN_CHANGES:** módulos de domínio; dados reais; serviços externos.
**Aceitação/testes:** migração sobe/desce em banco isolado; conexão e rollback são testados.
**DoD específico:** banco não é acessado diretamente pela camada web.

### TASK-003 — Identidade e confirmação de e-mail
**Status:** BLOCKED · **Phase:** PHASE-01 · **Priority:** CRITICAL
**Objetivo:** Implementar usuários, senha, registro, confirmação e recuperação seguros.
**Dependências:** `DEPENDS_ON: TASK-001, TASK-002`
**Relacionados:** RF-001, RN-001, RNF-001–003, ADR-003.
**Artefatos esperados:** identidade, tokens de uso único/expiração e caixa de saída local.
**ALLOWED_CHANGES:** `apps/api/src/modules/identity/**`; `apps/web/src/features/auth/**`; `database/**`; `tests/**identity/**`; `TASKS.md`.
**FORBIDDEN_CHANGES:** autorização de catálogo/comércio; PII em fixtures/logs.
**Aceitação/testes:** e-mail não confirmado não compra; token inválido/expirado falha sem enumeração; reset funciona.
**DoD específico:** hash, rate limit e testes de abuso aplicáveis passam.

### TASK-004 — RBAC, auditoria e exclusão solicitada
**Status:** BLOCKED · **Phase:** PHASE-01 · **Priority:** HIGH
**Objetivo:** Criar papéis, guardas de autorização, auditoria e solicitação de desativação.
**Dependências:** `DEPENDS_ON: TASK-003`
**Relacionados:** RF-002,022,023; RN-017; ADR-003.
**Artefatos esperados:** Admin, Catálogo, Estoquista, Cliente; trilha e solicitação de exclusão.
**ALLOWED_CHANGES:** `modules/identity/**`; `modules/audit/**`; `features/account/**`; `database/**`; `tests/**`; `TASKS.md`.
**FORBIDDEN_CHANGES:** retenção definitiva/legal; 2FA; catálogo e checkout.
**Aceitação/testes:** cada papel recebe negação correta; ação sensível cria auditoria sem PII explícita.
**DoD específico:** motivo obrigatório é imposto em ações definidas.

### TASK-005 — Checkpoint PHASE-01
**Status:** BLOCKED · **Phase:** PHASE-01 · **Priority:** HIGH
**Objetivo:** Validar base, identidade, segurança e rastreabilidade da fase.
**Dependências:** `DEPENDS_ON: TASK-004`
**Relacionados:** RNF-001–003,012.
**Artefatos esperados:** relatório de checkpoint e correções estritamente necessárias.
**ALLOWED_CHANGES:** testes/configuração das fases 01; documentação de qualidade; `TASKS.md`.
**FORBIDDEN_CHANGES:** funcionalidades PHASE-02+.
**Aceitação/testes:** build/lint/unidade/integração/segurança passam; ADRs e matriz conferem.
**DoD específico:** nenhum bloqueador de fundação conhecido.

### TASK-006 — Checkpoint de transição PHASE-01
**Status:** BLOCKED · **Phase:** PHASE-01 · **Priority:** CRITICAL
**Objetivo:** Autorizar formalmente início do catálogo após revalidar dependências.
**Dependências:** `DEPENDS_ON: TASK-001, TASK-002, TASK-003, TASK-004, TASK-005`
**Relacionados:** todos PHASE-01.
**Artefatos esperados:** evidência de gates e atualização de estado.
**ALLOWED_CHANGES:** `TASKS.md`; testes/configuração PHASE-01.
**FORBIDDEN_CHANGES:** código de catálogo ou comércio.
**Aceitação/testes:** ordem e estados validados; todos gates PHASE-01 verdes.
**DoD específico:** TASK-007 pode se tornar READY.

### TASK-007 — Domínio e administração do catálogo
**Status:** BLOCKED · **Phase:** PHASE-02 · **Priority:** CRITICAL
**Objetivo:** Implementar obra, autor, editora, categorias, edição, ISBN, preço e visibilidade.
**Dependências:** `DEPENDS_ON: TASK-006`
**Relacionados:** RF-003–005; RN-002,003.
**Artefatos esperados:** CRUD autorizado e página de catálogo.
**ALLOWED_CHANGES:** `modules/catalog/**`; `features/catalog/**`; `database/**`; `tests/**catalog/**`; `TASKS.md`.
**FORBIDDEN_CHANGES:** arquivos digitais; carrinho; estoque.
**Aceitação/testes:** múltiplas categorias, ISBN válido, versões/preços próprios e ocultação autorizada.
**DoD específico:** filtros básicos e RBAC cobertos.

### TASK-008 — Busca, filtros e descoberta
**Status:** BLOCKED · **Phase:** PHASE-02 · **Priority:** HIGH
**Objetivo:** Entregar pesquisa, filtros, ordenações e paginação do catálogo.
**Dependências:** `DEPENDS_ON: TASK-007`
**Relacionados:** RF-003,004; RN-002; RNF-004,005.
**Artefatos esperados:** consultas por título/autor e filtros aprovados.
**ALLOWED_CHANGES:** `modules/catalog/search/**`; `features/catalog/**`; `tests/**catalog/**`; `TASKS.md`.
**FORBIDDEN_CHANGES:** checkout; regra de avaliações ainda não implementada.
**Aceitação/testes:** filtros combinam; ocultos não aparecem; vazio é acessível e paginado.
**DoD específico:** consultas relevantes têm índices/revisão de plano.

### TASK-009 — Inventário e ativos privados
**Status:** BLOCKED · **Phase:** PHASE-02 · **Priority:** HIGH
**Objetivo:** Gerir estoque físico, licenças digitais e upload/versionamento privado local.
**Dependências:** `DEPENDS_ON: TASK-007`
**Relacionados:** RF-006,007; RN-003,004; ADR-004.
**Artefatos esperados:** inventário, movimentos, ativo/versionamento e adaptador local privado.
**ALLOWED_CHANGES:** `modules/catalog/assets/**`; `modules/inventory/**`; `storage/**`; `database/**`; `tests/**`; `TASKS.md`.
**FORBIDDEN_CHANGES:** endpoint público de download; pedidos.
**Aceitação/testes:** original não é servido publicamente; licença ilimitada/numerada e estoque são validados.
**DoD específico:** mudança gera auditoria apropriada.

### TASK-010 — Wishlist e painel de catálogo
**Status:** BLOCKED · **Phase:** PHASE-02 · **Priority:** HIGH
**Objetivo:** Implementar wishlist básica e indicadores de catálogo.
**Dependências:** `DEPENDS_ON: TASK-008, TASK-009`
**Relacionados:** RF-008,021.
**Artefatos esperados:** lista pessoal; métricas digitais, licenças, cupons e baixa disponibilidade.
**ALLOWED_CHANGES:** `modules/wishlist/**`; `modules/reporting/catalog/**`; `features/**`; `tests/**`; `TASKS.md`.
**FORBIDDEN_CHANGES:** notificações de wishlist; checkout.
**Aceitação/testes:** cliente só vê própria lista; perfil catálogo vê só indicadores autorizados.
**DoD específico:** sem alertas automáticos fora do escopo.

### TASK-011 — Checkpoint PHASE-02
**Status:** BLOCKED · **Phase:** PHASE-02 · **Priority:** CRITICAL
**Objetivo:** Verificar catálogo, busca, inventário e segurança de arquivos.
**Dependências:** `DEPENDS_ON: TASK-007, TASK-008, TASK-009, TASK-010`
**Relacionados:** RF-003–008; RNF-004,010.
**Artefatos esperados:** relatório e evidência de gates.
**ALLOWED_CHANGES:** testes/documentação PHASE-02; `TASKS.md`.
**FORBIDDEN_CHANGES:** carrinho/pedidos.
**Aceitação/testes:** autorizações, índices e não exposição de originais passam.
**DoD específico:** PHASE-03 desbloqueada.

### TASK-012 — Carrinho, cupom e frete
**Status:** BLOCKED · **Phase:** PHASE-03 · **Priority:** CRITICAL
**Objetivo:** Implementar carrinho, cupom global e simulação de frete por CEP/quantidade.
**Dependências:** `DEPENDS_ON: TASK-011`
**Relacionados:** RF-009–011; RN-005,008,009.
**Artefatos esperados:** carrinho híbrido, regras de cupom e configuração de frete.
**ALLOWED_CHANGES:** `modules/cart/**`; `modules/coupons/**`; `modules/shipping/**`; `features/checkout/**`; `tests/**`; `TASKS.md`.
**FORBIDDEN_CHANGES:** confirmação de pedido; gateway real.
**Aceitação/testes:** um cupom; validade/cota; endereço/CPF; frete somente físico; e-book duplicado é recusado.
**DoD específico:** valores usam decimal BRL e são recalculados no servidor.

### TASK-013 — Pedido e checkout transacional
**Status:** BLOCKED · **Phase:** PHASE-03 · **Priority:** HIGH
**Objetivo:** Criar pedido único híbrido, confirmação fictícia e consumo atômico de recursos.
**Dependências:** `DEPENDS_ON: TASK-012`
**Relacionados:** RF-012; RN-004,010,011; ADR-005.
**Artefatos esperados:** pedido, itens, endereço histórico e adaptador de pagamento simulado.
**ALLOWED_CHANGES:** `modules/orders/**`; `modules/payments/**`; `database/**`; `tests/**orders/**`; `TASKS.md`.
**FORBIDDEN_CHANGES:** gateway externo; biblioteca/download.
**Aceitação/testes:** R$0 pula pagamento; conflito não cria pedido; cupom/estoque/licença não sobrevendem.
**DoD específico:** idempotência e concorrência são testadas.

### TASK-014 — Notificações e ciclo de pedido
**Status:** BLOCKED · **Phase:** PHASE-03 · **Priority:** CRITICAL
**Objetivo:** Integrar caixa de saída simulada aos eventos de conta e pedido.
**Dependências:** `DEPENDS_ON: TASK-012, TASK-013`
**Relacionados:** RF-020; RN-018; ADR-005.
**Artefatos esperados:** modelos/eventos locais, histórico de entrega simulada e retries observáveis.
**ALLOWED_CHANGES:** `modules/notifications/**`; `modules/orders/**`; `modules/identity/**`; `tests/**`; `TASKS.md`.
**FORBIDDEN_CHANGES:** provedor externo; conteúdo PII nos logs.
**Aceitação/testes:** eventos exigidos disparam uma notificação simulada sem duplicação indevida.
**DoD específico:** falha não invalida pedido confirmado.

### TASK-015 — Checkpoint PHASE-03
**Status:** BLOCKED · **Phase:** PHASE-03 · **Priority:** HIGH
**Objetivo:** Validar compra gratuita/paga simulada, híbrida e concorrente.
**Dependências:** `DEPENDS_ON: TASK-014`
**Relacionados:** RF-009–012,020; RNF-009.
**Artefatos esperados:** cenários E2E e relatório.
**ALLOWED_CHANGES:** testes/documentação PHASE-03; `TASKS.md`.
**FORBIDDEN_CHANGES:** biblioteca, bundles e logística.
**Aceitação/testes:** todos cenários de checkout e regressões verdes.
**DoD específico:** não há sobre-venda conhecida.

### TASK-016 — Checkpoint de transição PHASE-03
**Status:** BLOCKED · **Phase:** PHASE-03 · **Priority:** CRITICAL
**Objetivo:** Autorizar a entrega digital e regras pós-compra.
**Dependências:** `DEPENDS_ON: TASK-012, TASK-013, TASK-014, TASK-015`
**Relacionados:** PHASE-03.
**Artefatos esperados:** confirmação de dependências/gates.
**ALLOWED_CHANGES:** `TASKS.md`; testes/configuração PHASE-03.
**FORBIDDEN_CHANGES:** novas funcionalidades.
**Aceitação/testes:** checkpoints e rastreabilidade aprovados.
**DoD específico:** TASK-017 torna-se elegível.

### TASK-017 — Biblioteca, download e marca d’água
**Status:** BLOCKED · **Phase:** PHASE-04 · **Priority:** CRITICAL
**Objetivo:** Conceder direitos, gerar cópias personalizadas e links temporários renováveis.
**Dependências:** `DEPENDS_ON: TASK-016`
**Relacionados:** RF-013,014; RN-012; ADR-004.
**Artefatos esperados:** biblioteca, eventos de download, processador PDF/ePub e política de link.
**ALLOWED_CHANGES:** `modules/library/**`; `modules/watermark/**`; `storage/**`; `features/library/**`; `tests/**`; `TASKS.md`.
**FORBIDDEN_CHANGES:** DRM; arquivo original público; reembolso.
**Aceitação/testes:** pré-venda bloqueia; cópia leva os três campos; original não é exposto; link expira/renova.
**DoD específico:** teste de PDF/ePub e falha de job observável.

### TASK-018 — Bundles e pré-vendas
**Status:** BLOCKED · **Phase:** PHASE-04 · **Priority:** HIGH
**Objetivo:** Implementar composição, preço proporcional e liberação de pré-vendas físicas/digitais.
**Dependências:** `DEPENDS_ON: TASK-017`
**Relacionados:** RF-015,016; RN-006,007,012,013.
**Artefatos esperados:** agregados/regras de bundle e agenda de lançamento.
**ALLOWED_CHANGES:** `modules/bundles/**`; `modules/preorders/**`; `modules/orders/**`; `modules/library/**`; `tests/**`; `TASKS.md`.
**FORBIDDEN_CHANGES:** descontos não especificados; expedição antes de lançamento.
**Aceitação/testes:** composição duplicada falha; desconto nunca negativo; todos possuídos bloqueia; liberação só na data.
**DoD específico:** compra de bundle concede cada item separadamente.

### TASK-019 — Cancelamentos e reembolsos
**Status:** BLOCKED · **Phase:** PHASE-04 · **Priority:** HIGH
**Objetivo:** Aplicar regras automáticas digitais e decisão administrativa/estado físico.
**Dependências:** `DEPENDS_ON: TASK-017, TASK-018`
**Relacionados:** RF-018; RN-013–015,017.
**Artefatos esperados:** solicitação, decisão, motivo e reversões transacionais adequadas.
**ALLOWED_CHANGES:** `modules/refunds/**`; `modules/orders/**`; `modules/library/**`; `modules/audit/**`; `tests/**`; `TASKS.md`.
**FORBIDDEN_CHANGES:** gateway real; regras legais não aprovadas.
**Aceitação/testes:** janelas 2h/2 semanas/1 semana; físico pré-envio; Admin auditado.
**DoD específico:** exceção não permite violar janela sem Admin.

### TASK-020 — Checkpoint PHASE-04
**Status:** BLOCKED · **Phase:** PHASE-04 · **Priority:** CRITICAL
**Objetivo:** Validar ciclo digital completo e pós-compra.
**Dependências:** `DEPENDS_ON: TASK-017, TASK-018, TASK-019`
**Relacionados:** RF-013–018; RNF-010.
**Artefatos esperados:** E2E de biblioteca/bundle/pré-venda/reembolso e relatório.
**ALLOWED_CHANGES:** testes/documentação PHASE-04; `TASKS.md`.
**FORBIDDEN_CHANGES:** logística, avaliações e painéis.
**Aceitação/testes:** originais protegidos, regras temporais e reversões passam.
**DoD específico:** PHASE-05 desbloqueada.

### TASK-021 — Estoque e logística física
**Status:** BLOCKED · **Phase:** PHASE-05 · **Priority:** HIGH
**Objetivo:** Entregar movimentos, alertas e estados/rastreio manuais para o Estoquista.
**Dependências:** `DEPENDS_ON: TASK-020`
**Relacionados:** RF-007,017; RN-004,012,015.
**Artefatos esperados:** transições de expedição, rastreio livre e indicadores físicos.
**ALLOWED_CHANGES:** `modules/inventory/**`; `modules/logistics/**`; `modules/reporting/warehouse/**`; `features/warehouse/**`; `tests/**`; `TASKS.md`.
**FORBIDDEN_CHANGES:** transportadoras; preço/catálogo pelo Estoquista.
**Aceitação/testes:** somente estoquista/Admin altera físico; transições inválidas e pré-venda antecipada falham.
**DoD específico:** cada status relevante notifica cliente.

### TASK-022 — Avaliações, denúncia e moderação
**Status:** BLOCKED · **Phase:** PHASE-05 · **Priority:** HIGH
**Objetivo:** Disponibilizar avaliação publicada, denúncia e remoção auditada.
**Dependências:** `DEPENDS_ON: TASK-020`
**Relacionados:** RF-019,022; RN-016,017.
**Artefatos esperados:** reviews, reports e moderação Admin.
**ALLOWED_CHANGES:** `modules/reviews/**`; `features/reviews/**`; `modules/audit/**`; `tests/**`; `TASKS.md`.
**FORBIDDEN_CHANGES:** aprovação prévia obrigatória; alteração de regras de compra.
**Aceitação/testes:** só adquirente cria; qualquer usuário denuncia; remoção exige motivo/auditoria.
**DoD específico:** catálogo calcula média somente de avaliações visíveis.

### TASK-023 — Painéis e relatórios essenciais
**Status:** BLOCKED · **Phase:** PHASE-05 · **Priority:** HIGH
**Objetivo:** Exibir indicadores confirmados com isolamento por papel.
**Dependências:** `DEPENDS_ON: TASK-020`
**Relacionados:** RF-021,023.
**Artefatos esperados:** painéis global, catálogo e estoque.
**ALLOWED_CHANGES:** `modules/reporting/**`; `features/dashboard/**`; `tests/**`; `TASKS.md`.
**FORBIDDEN_CHANGES:** exportação avançada; dados fora do papel.
**Aceitação/testes:** Admin vê total/clientes/pedidos/mais vendidos; catálogo vê digital/licença/cupom/baixa; Estoquista vê físico/status/baixa.
**DoD específico:** consultas não expõem PII desnecessária.

### TASK-024 — Privacidade operacional e observabilidade
**Status:** BLOCKED · **Phase:** PHASE-05 · **Priority:** HIGH
**Objetivo:** Completar solicitação de exclusão, avisos, auditoria e monitoramento técnico.
**Dependências:** `DEPENDS_ON: TASK-020`
**Relacionados:** RF-002,020,022; RNF-003,007,008; PD-002.
**Artefatos esperados:** fluxo de desativação/reativação durante período configurável, alertas e dashboards técnicos.
**ALLOWED_CHANGES:** `modules/privacy/**`; `modules/audit/**`; `modules/observability/**`; `modules/notifications/**`; `tests/**`; `TASKS.md`.
**FORBIDDEN_CHANGES:** declarar conformidade legal total; eliminação definitiva sem política aprovada.
**Aceitação/testes:** solicitação desativa, Admin acompanha, cliente recebe aviso; logs não contêm PII.
**DoD específico:** PD-002 permanece visível como limite.

### TASK-025 — Acessibilidade, responsividade e desempenho
**Status:** BLOCKED · **Phase:** PHASE-05 · **Priority:** HIGH
**Objetivo:** Validar meta WCAG A, navegadores, layouts e tempo de carregamento.
**Dependências:** `DEPENDS_ON: TASK-021, TASK-022, TASK-023, TASK-024`
**Relacionados:** RNF-004–006.
**Artefatos esperados:** testes automatizados/manuais e correções localizadas.
**ALLOWED_CHANGES:** `apps/web/**`; `tests/e2e/**`; `tests/accessibility/**`; `docs/architecture/**`; `TASKS.md`.
**FORBIDDEN_CHANGES:** alteração de regra de negócio; redesign não necessário.
**Aceitação/testes:** teclado, rótulos, contraste, mobile e navegadores-alvo passam; medição registrada.
**DoD específico:** qualquer meta não medida é marcada como falha, não presumida.

### TASK-026 — Checkpoint final V1
**Status:** BLOCKED · **Phase:** PHASE-05 · **Priority:** CRITICAL
**Objetivo:** Validar V1 integralmente contra requisitos, segurança, documentação e Scope Guard.
**Dependências:** `DEPENDS_ON: TASK-021, TASK-022, TASK-023, TASK-024, TASK-025`
**Relacionados:** todos RF/RN/RNF/UC/ADR.
**Artefatos esperados:** relatório final de release, matriz atualizada e riscos/pendências revisados.
**ALLOWED_CHANGES:** testes, documentação, configuração de qualidade e `TASKS.md`.
**FORBIDDEN_CHANGES:** funcionalidades fora de escopo; infraestrutura/integrações reais.
**Aceitação/testes:** gates completos, rastreabilidade, backup/restore ensaiado e testes de regressão aprovados.
**DoD específico:** V1 elegível para revisão humana; PD-001–003 explicitamente aceitos ou bloqueiam publicação.
