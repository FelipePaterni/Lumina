# Lumina Livros

**Versão:** 1.0
**Status:** PLANEJAMENTO APROVADO

## 1. Identificação e visão

Lumina Livros é uma aplicação web brasileira, responsiva, para descoberta e comercialização de livros físicos e e-books. Ela resolve a fragmentação entre catálogo, compra, entrega digital, estoque físico e operação administrativa.

O sistema oferece ao cliente busca, compra, lista de desejos, biblioteca digital, pedidos e avaliações; e à equipe interna catálogo, preços, cupons, estoque, logística, clientes e indicadores essenciais. O pagamento é deliberadamente fictício na V1: ao finalizar, o pedido pago é confirmado sem gateway externo.

## 2. Escopo da V1

- Cadastro, confirmação de e-mail, autenticação, recuperação de senha e perfil de cliente.
- Catálogo de obras com versões físicas/digitais, múltiplas categorias, busca e filtros.
- Carrinho, checkout, cupom global, frete simulado, pedido de valor zero e pagamento fictício.
- E-books individuais, gratuitos, bundles e pré-vendas; biblioteca, links temporários e marca d’água.
- Pedidos físicos, estoque, rastreio manual e estados de entrega.
- Wishlist, avaliações de compradores, denúncia e moderação administrativa.
- Painéis e indicadores essenciais para Administração Geral, Gestão de Catálogo e Estoquista.
- Notificações locais simuladas, auditoria de ações sensíveis e solicitação de exclusão de conta.

## 3. Fora de escopo

- Gateway de pagamento, emissão fiscal, antifraude e integração bancária.
- Transportadoras, cálculo real de frete e rastreamento externo.
- Leitor interno, DRM, aluguel, assinatura e alertas da wishlist.
- 2FA, exportação/portabilidade de dados, relatórios exportáveis/avançados e infraestrutura produtiva.
- Parecer ou certificação de conformidade legal; haverá preparação técnica para evolução e validação especializada.

## 4. Stakeholders e atores

| Ator | Responsabilidade e permissões principais |
|---|---|
| Visitante | Consultar catálogo e avaliações; criar conta ou autenticar-se. |
| Cliente | Comprar, usar cupom, manter wishlist, baixar e-books elegíveis, avaliar compras, consultar pedidos e solicitar exclusão. |
| Gestão de Catálogo | Gerir obras, versões, arquivos, preços, licenças, bundles, pré-vendas, cupons e visibilidade. |
| Estoquista | Gerir estoque físico, separação/envio/rastreio e relatórios de vendas físicas. |
| Administrador Geral | Acesso irrestrito, gestão de usuários, relatórios globais, moderação, reembolsos e acompanhamento de exclusões. |

Todos os perfis usam e-mail e senha; e-mail confirmado é pré-condição para ações autenticadas relevantes. Ações sensíveis exigem motivo e geram auditoria sem gravar valores pessoais em claro no log.

## 5. Requisitos funcionais

| ID | Requisito e aceitação resumida | Prioridade | Atores | RN / UC |
|---|---|---|---|---|
| RF-001 | Cadastrar, confirmar e-mail, autenticar e recuperar senha. Tokens expiram e não revelam existência de conta. | MUST | Cliente, equipe | RN-001; UC-001 |
| RF-002 | Manter perfil, histórico de compras e solicitação de exclusão. Solicitação desativa a conta e notifica cliente/admin. | MUST | Cliente, Admin | RN-018; UC-002 |
| RF-003 | Consultar catálogo e pesquisar por título ou autor; filtrar categoria, idioma, preço, mais vendidos, bem avaliados e lançamento. | MUST | Visitante, Cliente | RN-002; UC-003 |
| RF-004 | Exibir uma obra com metadados e versões físicas/digitais selecionáveis, cada uma com preço e disponibilidade próprios. | MUST | Visitante, Cliente | RN-003; UC-004 |
| RF-005 | Gestão de Catálogo cria/edita obras, múltiplas categorias, versões, capas, metadados, preço e visibilidade. ISBN deve ser válido. | MUST | Catálogo, Admin | RN-002,003; UC-005 |
| RF-006 | Gerir arquivos originais PDF/ePub e suas versões; publicação corrigida mantém histórico e atualiza biblioteca de adquirentes. | MUST | Catálogo, Admin | RN-003; UC-006 |
| RF-007 | Gerir disponibilidade: estoque físico numérico e licença digital numérica ou ilimitada. | MUST | Catálogo, Estoquista, Admin | RN-003,004; UC-007 |
| RF-008 | Adicionar/remover obras na wishlist pessoal. | SHOULD | Cliente | UC-008 |
| RF-009 | Manter carrinho com quantidades físicas; impedir recompra direta de e-book já possuído. | MUST | Cliente | RN-007; UC-009 |
| RF-010 | Aplicar no máximo um cupom global por pedido; validar tipo fixo/percentual, validade e cota de uso. | MUST | Cliente, Catálogo | RN-008; UC-010 |
| RF-011 | Calcular frete simulado por faixa de CEP e quantidade física, configurável pelo Admin, sem frete grátis. | MUST | Cliente, Admin | RN-009; UC-011 |
| RF-012 | Finalizar pedido híbrido, validar estoque/licenças atomicamente, confirmar pagamento fictício e registrar aquisição gratuita por R$ 0,00. | MUST | Cliente | RN-004,010,011; UC-012 |
| RF-013 | Entregar e-books pagos/gratuitos na biblioteca; pré-venda só libera na data de lançamento. | MUST | Cliente | RN-012; UC-013 |
| RF-014 | Gerar download temporário autenticado, personalizado com nome, e-mail e ID de compra, sem expor o original. | MUST | Cliente | RN-012; UC-014 |
| RF-015 | Criar bundles somente com livros existentes; impedir composição idêntica duplicada; liberar itens separadamente e ajustar preço por posse prévia. | MUST | Catálogo, Cliente | RN-005–007; UC-015 |
| RF-016 | Vender pré-vendas físicas e digitais e liberar/permitir expedição somente no lançamento. | MUST | Cliente, equipe | RN-012; UC-016 |
| RF-017 | Gerir pedido físico em `pago → em separação → enviado → entregue`, com rastreio manual. | MUST | Estoquista, Admin | RN-015; UC-017 |
| RF-018 | Cancelar/reembolsar conforme regras; automação válida para digital e decisão administrativa para físico. | MUST | Cliente, Admin | RN-013–015; UC-018 |
| RF-019 | Avaliar obra adquirida com 1–5 estrelas e comentário; publicar imediatamente; permitir denúncia e remoção administrativa. | SHOULD | Cliente, Admin | RN-016; UC-019 |
| RF-020 | Emitir e-mails simulados para confirmação, recuperação, compra, mudanças relevantes de pedido/conta, exclusão e correção de arquivo. | MUST | Sistema | RN-019; UC-020 |
| RF-021 | Exibir painéis: global, catálogo e físico, respeitando perfil. | MUST | Equipe | RN-020; UC-021 |
| RF-022 | Registrar auditoria de ações administrativas e sensíveis, incluindo ator, ação, alvo, data e motivo quando exigido. | MUST | Sistema, Admin | RN-017; UC-022 |
| RF-023 | Permitir gestão de usuários pelo Admin e acesso de cada papel apenas às ações autorizadas. | MUST | Admin | RN-021; UC-023 |

## 6. Requisitos não funcionais

| ID | Critério verificável |
|---|---|
| RNF-001 | Senhas com hash adaptativo; segredos fora do código; TLS obrigatório em produção. |
| RNF-002 | Autorização por papel e menor privilégio; testes cobrem acesso negado por papel. |
| RNF-003 | Dados pessoais minimizados, criptografados quando aplicável e não registrados em logs de auditoria. |
| RNF-004 | Páginas principais carregam em até 20 s na baseline local reproduzível da seção 6.1; a escala de produção continua pendente em PD-001. |
| RNF-005 | Interface responsiva em mobile/tablet/desktop e nas duas versões mais recentes de Chrome, Edge e Firefox. |
| RNF-006 | Meta WCAG 2.1 nível A: teclado, contraste, rótulos, mensagens de erro e texto alternativo. |
| RNF-007 | Backups semanais criptografados; restauração testada periodicamente; indisponibilidade planejada inferior a 4 h/mês. |
| RNF-008 | Auditoria e monitoramento de erros sem conteúdo de credenciais, arquivos ou PII. |
| RNF-009 | Operações de checkout preservam consistência de estoque, licença, cupom e pedido sob concorrência. |
| RNF-010 | Originais e downloads não podem ser públicos; links são temporários e autenticados. |
| RNF-011 | APIs usam validação de entrada, respostas de erro consistentes, paginação e proteção contra abuso. |
| RNF-012 | Módulos em camadas, contratos testáveis e cobertura de testes proporcional a risco. |
| RNF-013 | Web, API e dependências locais são executáveis em contêineres Docker; a configuração reproduzível não incorpora segredos ou dados reais. |

### 6.1 Baseline local de desempenho (TASK-025)

A validação local usa Windows x64, Intel Core i5-13450HX, 16 processadores lógicos e 15,7 GiB de memória, com Web/API/PostgreSQL locais via Docker Compose. Use somente o banco isolado `lumina_task009_test`, dados sintéticos do seed do catálogo (três obras visíveis), um único navegador e nenhuma carga concorrente. Registre versões de Node.js, npm, Docker, PostgreSQL e navegador no resultado. Esta baseline não representa capacidade de produção e não resolve PD-001.

Meça `/`, `/dashboard`, `/catalog/dashboard`, `/warehouse/dashboard` e `/operations/dashboard` no Chrome estável atual. Faça uma navegação de aquecimento e cinco medições independentes por rota. O cronômetro começa na navegação e termina quando o conteúdo principal está visível e a solicitação de dados da API terminou; em rota protegida sem sessão, a tela de login visível é o conteúdo principal. Cada uma das cinco medições deve ser menor ou igual a 20 segundos; registre os cinco valores, mediana e máximo. Viewports responsivos de referência: 390×844, 768×1024 e 1366×768.

## 7. Regras de negócio

| ID | Regra |
|---|---|
| RN-001 | E-mail confirmado é obrigatório para comprar, baixar, avaliar e operar perfis internos. |
| RN-002 | Obras possuem título, autor, editora, sinopse, capa, categorias, ISBN válido, idioma, lançamento e edição; uma obra pode ter várias categorias. |
| RN-003 | Uma obra pode ter versões física/digital com preço, ISBN, estoque/licença e disponibilidade independentes. Ocultar não remove acesso de quem já adquiriu. |
| RN-004 | Estoque/licença é validado e consumido somente no checkout confirmado; falta no instante impede pedido. |
| RN-005 | E-book não é recomprável diretamente; bundles podem conter item já possuído, mas não são compráveis se todos já forem possuídos. |
| RN-006 | Bundle é formado apenas por obras existentes e não pode repetir composição idêntica com preço diferente. |
| RN-007 | Preço de bundle = preço próprio − soma dos preços individuais vigentes dos e-books já possuídos, limitado a zero; cupom incide após esse ajuste. |
| RN-008 | Cupom global é fixo ou percentual, tem validade e máximo de usos, não possui mínimo/máximo de compra e há somente um por pedido. |
| RN-009 | Frete aplica-se apenas a itens físicos, por faixa de CEP e quantidade; não há frete grátis. |
| RN-010 | Checkout de físico exige nome, CPF válido, telefone e endereço brasileiro completo. Pedido híbrido é único; digital é liberado de forma independente. |
| RN-011 | Pedido de R$ 0,00 passa pelo carrinho e é confirmado sem pagamento; carrinho com item pago usa confirmação fictícia. |
| RN-012 | Pré-venda é cobrada/confirmada na compra; download e expedição física só ocorrem no lançamento. |
| RN-013 | Pré-venda pode ser cancelada até uma semana antes do lançamento. |
| RN-014 | E-book é reembolsável automaticamente até 2 h após gerar o link ou até 2 semanas da compra sem download; Admin pode reembolsar excepcionalmente. Reembolso revoga o acesso da biblioteca e restaura a licença, quando limitada. |
| RN-015 | Físico só pode ser cancelado antes de enviado; reembolso físico é decidido pelo Admin. O estoque só é restaurado após devolução confirmada, quando aplicável. |
| RN-016 | Avaliação exige aquisição da obra; qualquer usuário pode denunciar; Admin pode removê-la com motivo/auditoria. |
| RN-017 | Ações sensíveis devem ser auditadas sem copiar dados pessoais explícitos. |
| RN-018 | Solicitação de exclusão desativa a conta por 30 dias, prazo configurável. O cliente pode reativá-la durante esse período e impedir a exclusão definitiva; cliente e Admin recebem notificações do processo. |
| RN-019 | Notificações simuladas cobrem confirmação de e-mail, recuperação de senha, compra, mudanças relevantes de pedido ou conta, exclusão e correção de arquivo na biblioteca. |
| RN-020 | Painéis exibem somente os indicadores essenciais autorizados ao respectivo papel. |
| RN-021 | O primeiro Administrador Geral é criado por seed controlado; RBAC limita cada papel às ações autorizadas. |

## 8. Casos de uso

| UC | Objetivo, fluxo principal e exceções | RF |
|---|---|---|
| UC-001 | Criar/confirmar conta ou recuperar acesso; token inválido/expirado não confirma. | RF-001 |
| UC-002 | Manter perfil e solicitar exclusão; conta fica desativada pelo prazo configurado e pode ser reativada antes da exclusão definitiva. | RF-002 |
| UC-003 | Pesquisar e filtrar catálogo; filtros sem resultado preservam critérios e informam vazio. | RF-003–004 |
| UC-004 | Consultar detalhes de obra e selecionar edição física ou digital com preço e disponibilidade independentes. | RF-004 |
| UC-005 | Cadastrar obra e versões; metadado/ISBN/arquivo inválido impede publicação. | RF-005–007 |
| UC-006 | Gerir arquivo digital e versões; correção preserva histórico, atualiza adquirentes e envia aviso. | RF-006 |
| UC-007 | Ajustar estoque físico ou licença digital; disponibilidade é independente por edição. | RF-007 |
| UC-008 | Adicionar ou remover obra da wishlist própria. | RF-008 |
| UC-009 | Montar carrinho; e-book já possuído e quantidade indisponível são recusados. | RF-009 |
| UC-010 | Aplicar um cupom global; validade, tipo e cota inválidos recusam o pedido. | RF-010 |
| UC-011 | Calcular frete simulado por faixa de CEP e quantidade física. | RF-011 |
| UC-012 | Finalizar pedido; valida cupom, endereço, frete e estoque/licença em transação; falha não cria pedido. | RF-010–012 |
| UC-013 | Consultar biblioteca; itens pagos ou gratuitos elegíveis ficam disponíveis, exceto pré-venda antes do lançamento. | RF-013 |
| UC-014 | Solicitar download; valida aquisição e lançamento, gera cópia personalizada e link temporário. | RF-013–014 |
| UC-015 | Comprar bundle; calcula posse prévia e bloqueia bundle integralmente possuído. | RF-015 |
| UC-016 | Comprar pré-venda física ou digital; cobrança é confirmada na compra e liberação ocorre apenas no lançamento. | RF-016 |
| UC-017 | Atualizar expedição física; transições inválidas e pré-venda anterior ao lançamento são recusadas. | RF-017 |
| UC-018 | Solicitar/realizar cancelamento ou reembolso; regras de janela definem automático, análise ou recusa. | RF-018 |
| UC-019 | Avaliar/denunciar/moderar; somente comprador avalia e moderação é auditada. | RF-019, RF-022 |
| UC-020 | Registrar e entregar notificação simulada para os eventos obrigatórios, sem que falha de entrega invalide a operação de origem. | RF-020 |
| UC-021 | Consultar painel conforme papel; métricas não autorizadas são negadas. | RF-021, RF-023 |
| UC-022 | Registrar auditoria de ação sensível com ator, ação, alvo, momento e motivo, sem PII explícita. | RF-022 |
| UC-023 | Gerir usuários e verificar autorização por papel; acesso não autorizado é negado. | RF-023 |

## 9. Modelo conceitual do domínio

```mermaid
classDiagram
  User <|-- Customer
  User --> Role
  Work "1" --> "*" Edition
  Work "*" --> "*" Category
  Edition --> DigitalAsset
  Bundle "*" --> "*" Work
  Customer --> Order
  Order "1" --> "*" OrderItem
  OrderItem --> Edition
  Customer --> LibraryItem
  LibraryItem --> Edition
  Order --> Coupon
  Customer --> Review
  Work --> Review
  Edition --> Inventory
```

Agregados: **Obra** (metadados e edições), **Pedido** (itens, totais, cupom e transições), **Bundle** (composição única), e **Biblioteca** (direitos de acesso). Valores monetários usam decimal/moeda BRL; endereço é valor imutável armazenado no pedido.

## 10. Modelo inicial de dados

Entidades principais: `users`, `email_verification_tokens`, `staff_invitation_tokens`, `password_reset_tokens`, `account_deletion_requests`, `works`, `authors`, `publishers`, `categories`, `work_categories`, `editions`, `digital_assets`, `digital_asset_versions`, `inventory_movements`, `bundles`, `bundle_items`, `coupons`, `coupon_redemptions`, `carts`, `cart_items`, `shipping_rules`, `orders`, `order_items`, `shipping_addresses`, `library_items`, `download_events`, `reviews`, `review_reports`, `notifications`, `audit_logs`.

Índices relevantes: e-mail normalizado único; ISBN por edição; busca por título/autor; estado/data de pedido; disponibilidade; cupom/cota; chave canônica de composição de bundle; unicidade de biblioteca por cliente/edição. Todas as entidades mutáveis recebem identificador, criação, atualização e autoria quando aplicável.

```mermaid
erDiagram
  USERS ||--o{ ORDERS : places
  ORDERS ||--|{ ORDER_ITEMS : contains
  WORKS ||--|{ EDITIONS : has
  EDITIONS ||--o{ ORDER_ITEMS : purchased_as
  USERS ||--o{ LIBRARY_ITEMS : owns
  EDITIONS ||--o{ LIBRARY_ITEMS : grants
  BUNDLES ||--|{ BUNDLE_ITEMS : contains
  WORKS ||--o{ BUNDLE_ITEMS : composes
  WORKS }o--o{ CATEGORIES : classified_as
  USERS ||--o{ REVIEWS : writes
  WORKS ||--o{ REVIEWS : receives
```

## 11. Arquitetura proposta

Arquitetura em camadas, monólito modular: interface web, API de aplicação, domínio e infraestrutura. Módulos: identidade, catálogo, comércio, biblioteca, logística, avaliações, notificações, relatórios e auditoria. Inicialmente, tarefas de e-mail e personalização de arquivo podem ser processadas localmente com estado observável; o contrato deve permitir fila/objeto privado posterior.

```mermaid
flowchart LR
  Web[Web responsiva] --> API[API / Aplicação]
  API --> Domain[Domínio modular]
  Domain --> DB[(PostgreSQL)]
  Domain --> Files[Armazenamento local privado]
  Domain --> Jobs[Jobs locais]
  Jobs --> Mail[Caixa de saída simulada]
  Jobs --> Watermark[Personalização PDF/ePub]
  Domain --> Audit[Auditoria e observabilidade]
```

Erros de validação retornam problema padronizado; falhas de negócio não expõem detalhes internos. Checkout usa transação e bloqueio/concorrência apropriado para evitar sobre-venda.

## 12. APIs planejadas

| Método e rota | Finalidade / autorizado | RF |
|---|---|---|
| `POST /auth/register`, `/verify-email`, `/login`, `/password-reset/*` | Identidade pública autenticada | RF-001 |
| `GET /works`, `GET /works/{slug}` | Catálogo e filtros públicos | RF-003–004 |
| `POST/PATCH /works`, `PATCH /works/{id}/visibility` | Criar/editar/publicar obras; edição existente mantém identidade e histórico | RF-005–007 |
| `GET /admin/works`, `GET /admin/works/{id}` | Catálogo administrativo, incluindo obras ocultas; Admin/Catálogo | RF-005–007 |
| `GET /catalog/assets/{editionId}`, `POST /catalog/assets/{editionId}/versions` | Consultar/adicionar versões de ativos digitais; Admin/Catálogo | RF-006 |
| `GET /admin/inventory` | Listar edições e disponibilidade; Admin/Estoque | RF-007 |
| `GET/PATCH /inventory/{editionId}`, `/inventory/{editionId}/physical`, `/inventory/{editionId}/digital` | Consultar/ajustar disponibilidade com motivo e auditoria; Admin/Estoque | RF-007,022 |
| `GET /admin/users`, `PATCH /admin/users/{id}/role`, `PATCH /admin/users/{id}/status` | Consultar usuários, papéis e status; Admin | RF-023 |
| `POST /admin/users/invitations`, `POST /auth/accept-invitation` | Convidar equipe e ativar conta por token de uso único | RF-001,023 |
| `POST /bundles`, `/admin/coupons` | Criar bundles/cupons | RF-010,015 |
| `GET/POST/DELETE /wishlist` | Wishlist do cliente | RF-008 |
| `GET/POST/PATCH /cart` | Carrinho do cliente | RF-009–011 |
| `POST /checkout`, `GET /orders/{id}` | Pedido e confirmação fictícia | RF-012 |
| `GET /library`, `POST /library/{id}/download` | Biblioteca e link temporário | RF-013–014 |
| `PATCH /orders/{id}/shipping` | Expedição autorizada | RF-017 |
| `POST /orders/{id}/cancel`, `/refund` | Cancelamento e reembolso | RF-018 |
| `GET/POST /works/{id}/reviews`, `POST /reviews/{id}/reports`, `GET /admin/review-reports`, `DELETE /admin/reviews/{id}` | Avaliação/moderação | RF-019,022 |
| `GET /admin/dashboard`, `/catalog/dashboard`, `/warehouse/dashboard` | Indicadores por papel | RF-021 |
| `GET /admin/observability/dashboard` | Saúde operacional, outbox simulada e solicitações agregadas; somente Admin | RF-002,020,022 |

`GET /works` aceita `search`, `category`, `language`, `minPriceCents`, `maxPriceCents`, `releaseFrom`, `releaseTo`, `page` e `limit`. O parâmetro opcional `sort` aceita `BEST_SELLING` (pedidos confirmados menos quantidades com reembolso processado) ou `TOP_RATED` (média das avaliações visíveis); sem `sort`, mantém a ordenação por lançamento mais recente. Ordenações são aplicadas antes da paginação, obras ocultas não aparecem e valor inválido de `sort` retorna HTTP 400. A resposta mantém os agregados `averageRating` e `reviewCount` calculados com avaliações visíveis.

`GET /admin/works` e `GET /admin/inventory` aceitam busca e paginação; `/admin/works` também filtra visibilidade. `GET /admin/users` aceita busca por e-mail, papel, status e paginação. Convites só aceitam papéis de equipe existentes; o hash do token é persistido, o link retornado é mostrado uma única vez pela Web e expira em 24 horas. Aceitar convite define senha e confirma e-mail. `WEB_BASE_URL` controla a origem do link de ativação e assume `http://localhost:3000` localmente. Entradas são validadas, toda rota autenticada verifica papel e rotas administrativas sensíveis exigem `reason`. Códigos principais: 200/201, 400, 401, 403, 404, 409 para conflito de estoque/posse, 422 para regra de negócio e 429 para abuso.

Edição digital sem registro de inventário é tratada como ilimitada, assim como `digitalLicenseLimit: null`; o checkout cria o contador de alocações dentro da transação. Edição física sem inventário continua indisponível. Sessões Web de cliente/equipe usam o JWT em `sessionStorage` da aba, são restauradas após recarga e removidas ao sair ou quando o token expira; não há refresh token e o prazo atual do JWT é de uma hora.

## 13. Tecnologias sugeridas

A decisão final está em ADRs. Recomendação inicial: Next.js/React para interface, NestJS/TypeScript para API em camadas, PostgreSQL para transações, ORM com migrações controladas, armazenamento privado abstrato e fila substituível. Alternativas consideradas: Java/Spring, .NET, Django; cada uma é viável, mas TypeScript ponta a ponta reduz atrito para um MVP com contratos compartilháveis. Nenhuma dependência será instalada nesta etapa.

## 13.1 Execução local da fundação

Para preparar o ambiente completo e conhecer os fluxos disponíveis, siga o [Guia de uso local do Lumina](GUIA-USO-LOCAL.md).

Pré-requisitos: Node.js 24, npm 12 e Docker com Docker Compose. O Compose requer um `.env` local; crie-o a partir de `.env.example` e use somente valores sintéticos. Migrações e seed do catálogo são passos explícitos antes da primeira inicialização da API; consulte o guia acima para a sequência completa.

```bash
npm install
npm run lint
npm test
npm run build
docker compose up --build
```

A interface fica disponível em `http://localhost:3000`, a API em `http://localhost:3001` e o PostgreSQL local na porta `5433` por padrão (configurável por `POSTGRES_PORT`). Pagamento e notificações são simulados localmente.

Use `docker compose stop` para interromper os serviços mantendo os contêineres. O Compose atual não declara volume para o PostgreSQL; `docker compose down` remove o contêiner do banco e seus dados locais. Veja o [guia](GUIA-USO-LOCAL.md) antes de encerrar o ambiente.

## 14. Estratégia de segurança e privacidade

Aplicar OWASP ASVS proporcionalmente: hash de senha, JWTs assinados, com expiração e validação de emissor/audiência, expiração e uso único de tokens de ação, RBAC, rate limiting, CSRF conforme arquitetura, validação/sanitização, proteção contra enumeração, logs estruturados e controle de segredo. CPF/endereço são acessíveis apenas quando necessários. Solicitação de exclusão desativa a conta por 30 dias por padrão, prazo configurável por `ACCOUNT_DELETION_GRACE_PERIOD_DAYS` com inteiro positivo; a conta pode ser reativada durante esse intervalo. O vencimento não executa exclusão definitiva, cuja política jurídica permanece pendente em PD-002.

## 15. Estratégia de testes

Testes: unidade para domínio e regras; integração para persistência, transações e autorização; API para contratos; E2E para compra digital/física e administração; segurança para papéis/tokens; acessibilidade automatizada e manual; carga básica para catálogo/checkout. Cada TASK define os testes específicos.

## 16. Riscos

| Risco | Prob./impacto | Mitigação |
|---|---|---|
| Regras de consumo/LGPD incompletas | Média/Alta | PD-002, revisão jurídica antes de produção. |
| Marca d’água em ePub/PDF complexa | Média/Alta | Adaptador, arquivos de teste e validação antes de publicação. |
| Sobre-venda concorrente | Média/Alta | Transação, índices e testes de concorrência. |
| Escala desconhecida | Média/Média | PD-001, métricas e arquitetura modular. |
| Simulações divergirem de integrações reais | Alta/Média | Interfaces explícitas e testes de contrato. |

## 17. Roadmap

| Fase | Objetivo / conclusão |
|---|---|
| PHASE-01 | Base, convenções, identidade e segurança mínima; build/testes base passam. |
| PHASE-02 | Catálogo, inventário, busca e administração editorial prontos. |
| PHASE-03 | Carrinho, checkout, cupom, frete e pedido transacional prontos. |
| PHASE-04 | Biblioteca, downloads, bundles, pré-vendas e reembolso prontos. |
| PHASE-05 | Logística física, avaliações, painéis, privacidade e endurecimento concluídos. |

## 18. Matriz de rastreabilidade

| RF | RN | RNF | UC | Entidade/API | TASK |
|---|---|---|---|---|---|
| RF-001 | RN-001,021 | 001–003,011 | UC-001 | users/auth | TASK-003 |
| RF-002 | RN-018 | 003,008 | UC-002 | users/account-deletion | TASK-004,024 |
| RF-003–007 | RN-002–004 | 004–006,010–012 | UC-003–007 | works/editions/assets/inventory | TASK-007–010 |
| RF-008 | — | 002 | UC-008 | wishlist | TASK-010 |
| RF-009–012 | RN-004,005,008–011 | 009,011 | UC-009–012 | cart/coupons/shipping/orders | TASK-012–015 |
| RF-013–016 | RN-005–007,012–014 | 010 | UC-013–016 | library/bundles/preorders | TASK-017–020 |
| RF-017–023 | RN-015–017,019–021 | 002,003,008,011 | UC-017–023 | logistics/reviews/reporting/audit | TASK-021–026 |
| Ambiente conteinerizado | — | 013 | — | Dockerfiles/Compose | TASK-001 |

## 19. Pendências

| ID | Descrição / impacto / condição |
|---|---|
| PD-001 | Escala esperada. Afeta capacidade e metas de desempenho; resolver antes de produção. |
| PD-002 | Política jurídica de retenção/exclusão definitiva. A V1 adota desativação reativável por 30 dias configuráveis; prazo legal e retenções obrigatórias requerem revisão especializada antes de produção. |
| PD-003 | Provedor de hospedagem, e-mail e armazenamento. Afeta implantação; fora da V1 local. |
