# Backlog executável — Lumina Livros

Estados permitidos: `BLOCKED | READY | IN_PROGRESS | IN_REVIEW | DONE | FAILED | CANCELLED`. Toda TASK herda a DoD global de `AGENTS.md`: build, lint e testes aplicáveis aprovados, critérios atendidos, Scope Guard validado e estado atualizado. Política incidental padrão: `MINIMAL_DIRECTLY_CAUSED_CHANGES_ALLOWED`.

## Índice de execução

| Ordem | TASK | Fase | Prioridade | Dependências | Estado |
|---:|---|---|---|---|---|
| 1 | TASK-001 | PHASE-01 | CRITICAL | NONE | READY |
| 2 | TASK-002 | PHASE-01 | HIGH | TASK-001 | BLOCKED |
| 3 | TASK-003 | PHASE-01 | CRITICAL | TASK-001 | BLOCKED |
| 4 | TASK-004 | PHASE-01 | HIGH | TASK-003 | BLOCKED |
| 5 | TASK-005 | PHASE-01 | HIGH | TASK-002,TASK-003,TASK-004 | BLOCKED |
| 6 | TASK-006 | PHASE-02 | CRITICAL | TASK-005 | BLOCKED |
| 7 | TASK-007 | PHASE-02 | HIGH | TASK-006 | BLOCKED |
| 8 | TASK-008 | PHASE-02 | HIGH | TASK-006 | BLOCKED |
| 9 | TASK-009 | PHASE-02 | HIGH | TASK-007,TASK-008 | BLOCKED |
| 10 | TASK-010 | PHASE-02 | HIGH | TASK-009 | BLOCKED |
| 11 | TASK-011 | PHASE-03 | CRITICAL | TASK-010 | BLOCKED |
| 12 | TASK-012 | PHASE-03 | CRITICAL | TASK-011 | BLOCKED |
| 13 | TASK-013 | PHASE-03 | HIGH | TASK-012 | BLOCKED |
| 14 | TASK-014 | PHASE-03 | HIGH | TASK-013 | BLOCKED |
| 15 | TASK-015 | PHASE-03 | HIGH | TASK-014 | BLOCKED |
| 16 | TASK-016 | PHASE-03 | HIGH | TASK-015 | BLOCKED |
| 17 | TASK-017 | PHASE-04 | CRITICAL | TASK-016 | BLOCKED |
| 18 | TASK-018 | PHASE-04 | HIGH | TASK-017 | BLOCKED |
| 19 | TASK-019 | PHASE-04 | HIGH | TASK-018 | BLOCKED |
| 20 | TASK-020 | PHASE-04 | HIGH | TASK-019 | BLOCKED |
| 21 | TASK-021 | PHASE-04 | HIGH | TASK-020 | BLOCKED |
| 22 | TASK-022 | PHASE-04 | HIGH | TASK-021 | BLOCKED |

## TASK-001 — Inicializar aplicação em camadas e qualidade base

**Status:** READY  
**Phase/Priority:** PHASE-01 / CRITICAL  
**Dependências:** `DEPENDS_ON: NONE`  
**Relacionados:** RNF-001, RNF-002, ADR-001, ADR-002  
**Objetivo:** Criar o esqueleto executável em camadas, configuração local, lint, testes e convenções sem funcionalidades de domínio.  
**Artefatos esperados:** Aplicação compilável, estrutura apresentação/aplicação/domínio/infraestrutura, suíte mínima e instruções locais.  
**ALLOWED_CHANGES:** arquivos de ferramenta na raiz; `src/**`; `tests/**`; configuração de CI local; `TASKS.md`.  
**FORBIDDEN_CHANGES:** regras de negócio, endpoints comerciais, migrations de domínio, integrações externas reais.  
**Critérios de aceitação/Testes:** build, lint e teste de exemplo passam; camadas não possuem dependência invertida indevida.  
**DoD específico:** comandos documentados e execução reproduzível.

## TASK-002 — Definir infraestrutura e ambientes

**Status:** BLOCKED  
**Phase/Priority:** PHASE-01 / HIGH  
**Dependências:** `DEPENDS_ON: TASK-001`  
**Relacionados:** PD-001, PD-002, PD-004, RNF-006, RNF-007, ADR-004  
**Objetivo:** Decidir provedores, ambientes, segredos, backup e monitoramento.  
**Artefatos esperados:** ADR aceito, configurações de ambiente e runbook de backup/alerta.  
**ALLOWED_CHANGES:** `docs/architecture/**`; `docs/adr/**`; configuração de deployment/observabilidade; `TASKS.md`.  
**FORBIDDEN_CHANGES:** código de domínio, credenciais reais, produção sem aprovação.  
**Critérios de aceitação/Testes:** decisões de PD-001/002/004 registradas; plano de restauração verificável.  
**DoD específico:** ambiente de homologação e alertas definidos.  
**Bloqueio:** decisão explícita de provedor/ambientes necessária.

## TASK-003 — Identidade, papéis e consentimento

**Status:** BLOCKED  
**Phase/Priority:** PHASE-01 / CRITICAL  
**Dependências:** `DEPENDS_ON: TASK-001`  
**Relacionados:** RF-001, RF-002, RN-001, RN-009, UC-001, ADR-003  
**Objetivo:** Implementar conta, confirmação de e-mail, recuperação, elegibilidade e RBAC.  
**Artefatos esperados:** usuário/roles, sessões, confirmação, recuperação, aceite de termos e guardas de autorização.  
**ALLOWED_CHANGES:** módulos auth/users; persistência de identidade; testes auth; `TASKS.md`.  
**FORBIDDEN_CHANGES:** checkout, catálogo, Stripe, download.  
**Critérios de aceitação/Testes:** CPF único/imutável; menor, não confirmado, bloqueado ou sem aceite não compra; último admin não pode ser removido/rebaixado.  
**DoD específico:** testes unitários/API de autenticação e RBAC passam.

## TASK-004 — Auditoria e fundações de privacidade

**Status:** BLOCKED  
**Phase/Priority:** PHASE-01 / HIGH  
**Dependências:** `DEPENDS_ON: TASK-003`  
**Relacionados:** RF-015, RNF-004, RNF-008, ADR-003  
**Objetivo:** Disponibilizar auditoria e fluxo-base de solicitação/desativação de exclusão.  
**Artefatos esperados:** AuditLog, DeletionRequest, autorização de admin e notificações em abstração.  
**ALLOWED_CHANGES:** módulos users/audit/notifications; persistência correspondente; testes; `TASKS.md`.  
**FORBIDDEN_CHANGES:** exclusão física definitiva sem PD-003, Stripe, catálogo.  
**Critérios de aceitação/Testes:** solicitação desativa e pode reativar no prazo; ações auditadas não expõem segredo.  
**DoD específico:** prazo legal permanece configurável/pendente, sem premissa jurídica oculta.

## TASK-005 — Checkpoint PHASE-01

**Status:** BLOCKED  
**Phase/Priority:** PHASE-01 / HIGH  
**Dependências:** `DEPENDS_ON: TASK-002,TASK-003,TASK-004`  
**Relacionados:** RNF-001–008  
**Objetivo:** Validar fundação, decisões, segurança e rastreabilidade da fase.  
**Artefatos esperados:** relatório de checkpoint e correções estritamente necessárias.  
**ALLOWED_CHANGES:** testes/configuração/documentação de fase; `TASKS.md`.  
**FORBIDDEN_CHANGES:** funcionalidades PHASE-02+.  
**Critérios de aceitação/Testes:** todos os gates da fase passam; nenhum PD bloqueante foi ignorado.  
**DoD específico:** PHASE-02 torna-se elegível.

## TASK-006 — Catálogo, arquivos e estados de publicação

**Status:** BLOCKED  
**Phase/Priority:** PHASE-02 / CRITICAL  
**Dependências:** `DEPENDS_ON: TASK-005`  
**Relacionados:** RF-003, RF-012, RN-003, UC-002/006  
**Objetivo:** Criar domínio e administração de livro, arquivo, preço, licença e rascunho/publicado/inativo.  
**Artefatos esperados:** CRUD autorizado, validação ISBN, arquivos PDF/EPUB e índice de busca.  
**ALLOWED_CHANGES:** módulos catalog/admin-catalog; persistência; testes; `TASKS.md`.  
**FORBIDDEN_CHANGES:** pagamentos, bundles, downloads personalizados.  
**Critérios de aceitação/Testes:** só ativo/publicado é comprável; inativação preserva propriedade existente; limite ilimitado ou numérico válido.  
**DoD específico:** API e testes de permissão do gestor/admin completos.

## TASK-007 — Importação CSV atômica

**Status:** BLOCKED  
**Phase/Priority:** PHASE-02 / HIGH  
**Dependências:** `DEPENDS_ON: TASK-006`  
**Relacionados:** RF-012, RN-007, UC-006  
**Objetivo:** Importar catálogo usando os mesmos validadores do cadastro manual.  
**Artefatos esperados:** endpoint/UI administrativa, transação e relatório de linhas inválidas.  
**ALLOWED_CHANGES:** importação de catálogo, testes integração, documentação CSV, `TASKS.md`.  
**FORBIDDEN_CHANGES:** relaxar validações de produto, alterar pagamentos.  
**Critérios de aceitação/Testes:** uma linha inválida não persiste nenhuma linha; erro identifica linha/campo.  
**DoD específico:** teste de rollback real passa.

## TASK-008 — Busca, filtros e wishlist

**Status:** BLOCKED  
**Phase/Priority:** PHASE-02 / HIGH  
**Dependências:** `DEPENDS_ON: TASK-006`  
**Relacionados:** RF-003, RF-004, UC-002  
**Objetivo:** Expor busca paginada e wishlist do cliente.  
**Artefatos esperados:** filtros, ordenações, operações de wishlist e contratos API/UI.  
**ALLOWED_CHANGES:** módulos catalog/search/wishlist, testes e `TASKS.md`.  
**FORBIDDEN_CHANGES:** alertas de preço, checkout, avaliação.  
**Critérios de aceitação/Testes:** todos filtros especificados combinam corretamente; usuário só vê/edita sua wishlist.  
**DoD específico:** testes API e acessibilidade dos filtros.

## TASK-009 — Cupons e bundles

**Status:** BLOCKED  
**Phase/Priority:** PHASE-02 / HIGH  
**Dependências:** `DEPENDS_ON: TASK-007,TASK-008`  
**Relacionados:** RF-005, RF-010, RN-005, RN-006  
**Objetivo:** Administrar cupons e bundles, incluindo invariantes de conjunto.  
**Artefatos esperados:** desconto fixo/percentual, validade/uso máximo; bundle com assinatura única.  
**ALLOWED_CHANGES:** módulos catalog/bundles/coupons, testes e `TASKS.md`.  
**FORBIDDEN_CHANGES:** criação de pagamento, cálculo final de checkout.  
**Critérios de aceitação/Testes:** cupom não aplica em gratuito; conjunto idêntico duplicado é recusado; bundle só referencia livros existentes.  
**DoD específico:** regras unitárias e autorização passam.

## TASK-010 — Checkpoint PHASE-02

**Status:** BLOCKED  
**Phase/Priority:** PHASE-02 / HIGH  
**Dependências:** `DEPENDS_ON: TASK-009`  
**Relacionados:** RF-003–005, RF-010, RF-012  
**Objetivo:** Validar catálogo completo, importação, descoberta e gestão.  
**Artefatos esperados:** relatório, testes integrados e rastreabilidade atualizada.  
**ALLOWED_CHANGES:** testes/documentação/configuração de fase; `TASKS.md`.  
**FORBIDDEN_CHANGES:** pagamento, biblioteca e entrega.  
**Critérios de aceitação/Testes:** build/lint/unit/integration/API passam.  
**DoD específico:** PHASE-03 elegível.

## TASK-011 — Carrinho e preço de pedido

**Status:** BLOCKED  
**Phase/Priority:** PHASE-03 / CRITICAL  
**Dependências:** `DEPENDS_ON: TASK-010`  
**Relacionados:** RF-005, RN-005, UC-003  
**Objetivo:** Implementar carrinho, elegibilidade, preço capturado, cupom e desconto proporcional de bundle.  
**Artefatos esperados:** carrinho/checkout sem captura, cálculo determinístico e order items.  
**ALLOWED_CHANGES:** módulos cart/orders/pricing, testes e `TASKS.md`.  
**FORBIDDEN_CHANGES:** integração Stripe, geração de arquivo.  
**Critérios de aceitação/Testes:** gratuito segue checkout sem Pix quando carrinho só possui gratuitos; e-book possuído bloqueia; bundle parcial desconta e total possuído bloqueia.  
**DoD específico:** invariantes de preço cobertas por unit/integration.

## TASK-012 — Pix Stripe, webhooks e reservas

**Status:** BLOCKED  
**Phase/Priority:** PHASE-03 / CRITICAL  
**Dependências:** `DEPENDS_ON: TASK-011`  
**Relacionados:** RF-006, RF-007, RN-002, RNF-005, ADR-002  
**Objetivo:** Integrar Pix, expiração de 24h, reserva de licença e webhooks idempotentes.  
**Artefatos esperados:** adaptador Stripe, eventos persistidos, job de expiração e alertas de falha.  
**ALLOWED_CHANGES:** módulos payment/licenses/orders, integração Stripe, testes/mocks e `TASKS.md`.  
**FORBIDDEN_CHANGES:** credenciais reais, alterações de catálogo sem necessidade direta.  
**Critérios de aceitação/Testes:** assinatura inválida rejeitada; evento repetido não duplica efeitos; reserva expira; última licença não sofre oversell.  
**DoD específico:** testes de concorrência e webhook passam.

## TASK-013 — Liberação, pré-venda e e-mails de pedido

**Status:** BLOCKED  
**Phase/Priority:** PHASE-03 / HIGH  
**Dependências:** `DEPENDS_ON: TASK-012`  
**Relacionados:** RF-007, RF-014, UC-004  
**Objetivo:** Liberar item pago conforme lançamento e notificar cada mudança relevante.  
**Artefatos esperados:** estados por item, job de lançamento, notificações de pedido/compra/pré-venda.  
**ALLOWED_CHANGES:** módulos orders/notifications/jobs, testes e `TASKS.md`.  
**FORBIDDEN_CHANGES:** marca d'água, UI de download, reembolso.  
**Critérios de aceitação/Testes:** pedido misto libera apenas itens lançados; pré-venda só libera na data; cada status relevante enfileira e-mail.  
**DoD específico:** jobs idempotentes e testados.

## TASK-014 — Reembolso por item e devolução de licença

**Status:** BLOCKED  
**Phase/Priority:** PHASE-03 / HIGH  
**Dependências:** `DEPENDS_ON: TASK-013`  
**Relacionados:** RF-013, RN-004, RN-003, UC-005  
**Objetivo:** Aplicar reembolso automático pelas janelas e exceção administrativa.  
**Artefatos esperados:** validação por item, integração Stripe, auditoria, estado e retorno de licença condicional.  
**ALLOWED_CHANGES:** módulos refunds/orders/licenses/admin, testes e `TASKS.md`.  
**FORBIDDEN_CHANGES:** moderação e marca d'água.  
**Critérios de aceitação/Testes:** janela pré-venda/download/sem download é correta; admin autorizado excepciona; licença só retorna se ativo.  
**DoD específico:** testes de autorização e transação passam.

## TASK-015 — Checkpoint PHASE-03

**Status:** BLOCKED  
**Phase/Priority:** PHASE-03 / HIGH  
**Dependências:** `DEPENDS_ON: TASK-014`  
**Relacionados:** RF-005–007, RF-010, RF-013, RN-002–006  
**Objetivo:** Validar comércio fim a fim, integridade de licença e pagamentos.  
**Artefatos esperados:** testes de cenário completo e relatório.  
**ALLOWED_CHANGES:** testes/configuração/documentação de fase; `TASKS.md`.  
**FORBIDDEN_CHANGES:** novos recursos PHASE-04.  
**Critérios de aceitação/Testes:** Pix simulado, expiração, pré-venda, bundle e reembolso passam.  
**DoD específico:** PHASE-04 elegível.

## TASK-016 — Downloads personalizados e atualização de obra

**Status:** BLOCKED  
**Phase/Priority:** PHASE-03 / HIGH  
**Dependências:** `DEPENDS_ON: TASK-015`  
**Relacionados:** RF-008, RF-009, RF-014, UC-004, ADR-005  
**Objetivo:** Gerar entrega segura PDF/EPUB marcada e notificar nova versão.  
**Artefatos esperados:** autorização da biblioteca, evento de clique, links temporários, pipeline de marca d'água e atualização.  
**ALLOWED_CHANGES:** módulos library/files/notifications, armazenamento e testes; `TASKS.md`.  
**FORBIDDEN_CHANGES:** alterar critérios de reembolso, regras Stripe.  
**Critérios de aceitação/Testes:** ambos formatos disponíveis são baixáveis; clique é registrado; arquivo contém dados requeridos; atualização alerta possuidores.  
**DoD específico:** prova de integração PDF/EPUB e testes ownership concluídos.

## TASK-017 — Avaliações, denúncia e moderação

**Status:** BLOCKED  
**Phase/Priority:** PHASE-04 / CRITICAL  
**Dependências:** `DEPENDS_ON: TASK-016`  
**Relacionados:** RF-011, RN-008, UC-007  
**Objetivo:** Implementar avaliações verificadas, denúncias, ocultação e sanção de comentário.  
**Artefatos esperados:** review/report, telas/API públicas/admin e auditoria.  
**ALLOWED_CHANGES:** módulos reviews/moderation/admin, testes e `TASKS.md`.  
**FORBIDDEN_CHANGES:** mudar RBAC central, pagamentos.  
**Critérios de aceitação/Testes:** apenas comprador avalia; autenticado denuncia; oculto não aparece público e é visível a gestor/admin.  
**DoD específico:** testes de autorização/moderação passam.

## TASK-018 — Alertas de wishlist e licença baixa

**Status:** BLOCKED  
**Phase/Priority:** PHASE-04 / HIGH  
**Dependências:** `DEPENDS_ON: TASK-017`  
**Relacionados:** RF-004, RF-014, RF-013  
**Objetivo:** Disparar alertas de produto desejado e alertas administrativos de licença.  
**Artefatos esperados:** eventos, preferências/filas necessárias e limiar global/individual.  
**ALLOWED_CHANGES:** módulos wishlist/licenses/notifications/admin, testes e `TASKS.md`.  
**FORBIDDEN_CHANGES:** novos canais de notificação, mudança de preço.  
**Critérios de aceitação/Testes:** promoção/preço/disponibilidade notifica wishlist; limiar individual prevalece ao global.  
**DoD específico:** deduplicação de eventos testada.

## TASK-019 — Painel de vendas e gestão administrativa

**Status:** BLOCKED  
**Phase/Priority:** PHASE-04 / HIGH  
**Dependências:** `DEPENDS_ON: TASK-018`  
**Relacionados:** RF-013, RN-009  
**Objetivo:** Concluir indicadores por mês/período e gestão de clientes/bloqueio para admin.  
**Artefatos esperados:** métricas faturamento, unidades, mais vendidos, licença baixa; administração de contas.  
**ALLOWED_CHANGES:** módulos admin/metrics/users, testes e `TASKS.md`.  
**FORBIDDEN_CHANGES:** relatórios exportáveis, permissões de gestor além do README.  
**Critérios de aceitação/Testes:** filtros de período funcionam; gestor não acessa operação; bloqueio impede ações previstas.  
**DoD específico:** RBAC e agregações testadas.

## TASK-020 — Exclusão, observabilidade e hardening

**Status:** BLOCKED  
**Phase/Priority:** PHASE-04 / HIGH  
**Dependências:** `DEPENDS_ON: TASK-019`  
**Relacionados:** RF-015, RNF-004–008, PD-003/004  
**Objetivo:** Completar alertas, logs, monitoramento, exclusão e controles de segurança.  
**Artefatos esperados:** logs estruturados, health checks, alertas, rotina de exclusão configurável e documentação operacional.  
**ALLOWED_CHANGES:** observabilidade, users/audit, segurança, testes/docs e `TASKS.md`.  
**FORBIDDEN_CHANGES:** definição unilateral de prazo legal ou provedor de produção.  
**Critérios de aceitação/Testes:** falha webhook alerta; health check monitora; exclusão envia avisos; dados sensíveis não surgem em logs.  
**DoD específico:** PD-003/004 resolvidos ou bloqueio formal antes de produção.

## TASK-021 — Qualidade de interface, acessibilidade e E2E

**Status:** BLOCKED  
**Phase/Priority:** PHASE-04 / HIGH  
**Dependências:** `DEPENDS_ON: TASK-020`  
**Relacionados:** RNF-001–003, UC-001–008  
**Objetivo:** Verificar experiência responsiva, WCAG A e fluxos ponta a ponta.  
**Artefatos esperados:** testes E2E, checks de acessibilidade e registro de desempenho.  
**ALLOWED_CHANGES:** UI, testes E2E/a11y, configuração de teste e `TASKS.md`.  
**FORBIDDEN_CHANGES:** mudanças de requisito, arquitetura ou regra comercial.  
**Critérios de aceitação/Testes:** fluxos críticos funcionam em viewport desktop/mobile e sem bloqueios de teclado; medição cumpre RNF-003.  
**DoD específico:** resultados anexados ao relatório da TASK.

## TASK-022 — Checkpoint PHASE-04 e readiness de lançamento

**Status:** BLOCKED  
**Phase/Priority:** PHASE-04 / HIGH  
**Dependências:** `DEPENDS_ON: TASK-021`  
**Relacionados:** todos RF/RN/RNF/UC/ADR  
**Objetivo:** Executar validação final de arquitetura, segurança, backup, rastreabilidade e release.  
**Artefatos esperados:** checklist de lançamento, relatório de gates e matriz de riscos atualizada.  
**ALLOWED_CHANGES:** testes, configuração de release, documentação de operação e `TASKS.md`.  
**FORBIDDEN_CHANGES:** funcionalidades novas, atalhos de segurança, mudança não aprovada de escopo.  
**Critérios de aceitação/Testes:** todos gates, backup/restauração, webhooks, autorização e rastreabilidade aprovados.  
**DoD específico:** V1 pronta para decisão de produção; pendências restantes explicitamente aceitas.
