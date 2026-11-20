# TASK-017 — Plano e evidências dos gates

Data: 2026-11-20. Branch: `feature/TASK-017-biblioteca-download-watermark`.

## GATE-001 — Recontextualização e prontidão

**Estado: APROVADO.** TASK-017 foi a primeira tarefa `READY` na ordem. TASK-016 está `DONE`, com GATE-001 a GATE-005 aprovados e revisão humana registrada em `docs/testing/TASK-016-testes-manuais-resultado.md`. O Definition of Ready de TASK-017 está definido: RF-013/RF-014, RN-012, UC-013/014, critérios de aceite, testes, DoD e Scope Guard existem. ADR-004 está `ACCEPTED`. A árvore inicial em `main` estava limpa; branch específica criada antes de alterar `TASKS.md`.

## GATE-002 — Contexto histórico e pré-condições

**Estado: APROVADO.** Foram lidos `AGENTS.md`, `README.md`, `TASKS.md`, ADR-004, prompts 001–007, schema Prisma, módulos de pedidos, identidade, auditoria, upload de arquivos, storage local, ownership e testes relacionados.

### Fatos confirmados e baseline

- O schema já possui `LibraryItem`, `OrderItem`, `DigitalAsset` e `DigitalAssetVersion`, incluindo `storageKey`, `checksum`, `mimeType` e indicação de original. `Work.releaseDate` permite a verificação temporal de pré-venda.
- `LibraryOwnershipService` consulta `LibraryItem`; `OrderService` já protege recompra consultando propriedade e pedidos confirmados. O checkout não cria projeção `LibraryItem`; biblioteca poderá derivar os direitos de `OrderItem` confirmado sem migration, se mantido esse desenho.
- `PrivateLocalStorage` grava em `storage/private/{original,derived}` e não oferece leitura. `AssetsService` guarda versões e oculta `storageKey` nas respostas. Não há módulo/rota de biblioteca, gerador personalizado ou rota de download.
- Não existe modelo `DownloadEvent`. `AuditService` já grava eventos de auditoria sanitizados; pode tornar solicitações/falhas observáveis sem alteração de schema.
- `apps/api/src/app.module.ts` precisa registrar o módulo de biblioteca; esse arquivo está fora do `ALLOWED_CHANGES`, mas o registro isolado é incidental e tecnicamente necessário.
- `npm test`: 50/50 aprovados. `npm run lint`: código 0. `npm run build`: código 0; build API e Next.js concluído.
- `pdf-lib` e `jszip` não estavam instalados; após autorização foram adicionados como dependências runtime `pdf-lib@1.17.1` e `jszip@3.10.2`. O `npm install` concluiu com 0 vulnerabilidades reportadas.

## GATE-003 — Planejamento mínimo

O plano técnico requer leitura restrita do original privado; watermark legível nas páginas PDF; nova página XHTML no spine EPUB com nome, e-mail e ID do pedido; armazenamento somente da cópia derivada; biblioteca a partir de compras digitais confirmadas; bloqueio até o lançamento; links renováveis com token opaco de 15 minutos; e auditoria de falhas sem PII. Não haverá alteração de schema: direitos são derivados de pedidos confirmados e eventos usam `AuditService`. O registro de `LibraryModule` em `AppModule` será incidental e documentado.

Para processar os formatos sem inventar implementações inseguras, são necessárias dependências runtime para manipular PDF e ZIP/EPUB. Em 2026-11-20, o responsável autorizou a ampliação de `ALLOWED_CHANGES` para `apps/api/package.json` e `package-lock.json`. O registro de `LibraryModule` em `AppModule` será incidental mínimo. Não haverá alteração de schema/migration; a biblioteca deriva direitos de compras confirmadas e usa auditoria existente para observabilidade.

**Estado: APROVADO.** Escopo ampliado com autorização explícita. `pdf-lib` processa PDF e `jszip` modifica EPUB mantendo `mimetype` primeiro e não comprimido. O cliente informará `name` no POST de solicitação do link, pois o modelo atual não armazena nome; esse valor só entra na cópia e não será persistido ou registrado. O endpoint exige CUSTOMER autenticado com e-mail confirmado, pedido digital confirmado e data de lançamento atingida. Links usam token AES-256-GCM opaco derivado do segredo JWT, expiram em 15 minutos e podem ser renovados pela emissão autenticada de novo link. `AuditService` registra emissão, download e falhas somente com IDs, formato e códigos sanitizados. O corpo de resposta não expõe `storageKey`; GET de download lê apenas `derived`. Rollback: remover dependências e reverter somente arquivos exclusivos da TASK-017; sem migration ou alteração de dados.

### Plano de arquivos

- Alterar: `apps/api/src/storage/private-local.storage.ts`, `apps/api/src/app.module.ts` (incidental), `apps/api/package.json`, `package-lock.json`, `TASKS.md`.
- Criar: `apps/api/src/modules/library/**`, `apps/api/src/modules/watermark/**`; unitários de processamento e tokens; integração API no banco isolado; `tests/manual/task-017/**`; `docs/testing/TASK-017-testes-manuais-resultado.md`.
- Não tocar: schema/migrations, `OrderService`, módulos de reembolso, originais armazenados, leitores DRM, rotas públicas de asset e interface fora de `features/library/**`.

### Matriz de implementação

| Requisito | Implementação/verificação |
|---|---|
| Direitos de biblioteca | Listar edições digitais de `OrderItem` em pedidos `CONFIRMED` do cliente atual; negar propriedade de outro cliente e itens físicos. |
| Pré-venda | Marcar a edição indisponível até `Work.releaseDate`; negar link e download anteriores a essa data. |
| Cópia personalizada | Baixar versão marcada como original do storage privado; PDF recebe texto em cada página; EPUB recebe página XHTML no manifest/spine. Incluir nome fornecido, e-mail da conta e identificador do pedido. |
| Arquivo original privado | Validar chave de storage por escopo e confinamento no root; servir somente cópia `derived`, sempre como attachment, com `Cache-Control: private, no-store` e `X-Content-Type-Options: nosniff`. |
| Link temporário/renovável | Token AES-GCM opaco vinculado a cliente/edição/pedido/cópia e expiração de 15 minutos; novo POST autenticado emite novo link. Testar token adulterado/expirado e renovação. |
| Falha de job observável | Capturar falha de transformação com código controlado; registrar `DIGITAL_COPY_PROCESSING_FAILED` sem conteúdo, e-mail ou token; responder erro genérico. |
| Manual | Roteiro PowerShell com credenciais PSCredential e API local; relatório bloqueado até revisão humana e inspeção de cópia temporária. |

Impacto: API nova; nenhuma migration; nenhuma página web obrigatória nos critérios, embora `features/library/**` permaneça permitida; dados de teste sintéticos; validação de segurança/regressão e suites do workspace.

## Estado dos gates

| Gate | Estado | Evidência |
|---|---|---|
| GATE-001 — Prontidão | APROVADO | Dependência, critérios, ADR, branch e árvore inicial conferidos. |
| GATE-002 — Contexto histórico | APROVADO | Código, schema, testes relacionados e baseline registrados acima. |
| GATE-003 — Planejamento mínimo | APROVADO | Plano autorizado; dependências delimitadas, rollback e mitigação registrados. |
| GATE-004 — Implementação controlada | APROVADO | Módulo de biblioteca, processamento PDF/EPUB, token temporário, storage privado e cobertura unitária adicionados; build API e testes unitários aprovados. |
| GATE-005 — Revisão e gates automatizados | APROVADO | `npm test` 59/59, lint, build geral e integração 8/8 aprovados. Integração usou exclusivamente `lumina_task009_test`; build e integração executados fora do sandbox para acesso local/escrita. |
| GATE-006 — Testes manuais | PENDENTE | Runner criado e sintaxe PowerShell validada; cenários ainda bloqueados até execução e inspeção humana da cópia personalizada. |
| GATE-007 — Conclusão e rastreabilidade | PENDENTE | Depende da aprovação humana de GATE-006. |

## Scope Guard

Alterações primárias estão delimitadas a biblioteca, marca d’água, storage privado, testes, manifestos autorizados e `TASKS.md`. Incidental mínimo: registro de `LibraryModule` no `apps/api/src/app.module.ts` e `docs/testing/TASK-017-*.md` para rastreabilidade. Permanecem proibidos DRM, exposição de originais e reembolso.

## GATE-004 — Implementação controlada

**Estado: APROVADO.** Implementados `GET /library`, emissão autenticada de link e download por token AES-GCM; compras confirmadas digitais são a fonte de direitos. A emissão rejeita edição não comprada e pré-venda até `releaseDate`, e só lê originais do storage privado. PDF é marcado em cada página; EPUB recebe página XHTML no manifest/spine. O nome informado só participa do arquivo gerado. Auditoria registra IDs, formatos e códigos sem nome, e-mail, token ou conteúdo. A leitura de storage aceita apenas chaves hash e escopo explícito; extensão/MIME/chave precisam corresponder.

Testes unitários cobrem PDF, EPUB, arquivos inválidos, token adulterado/expirado, storage confinado, negação de compra alheia e bloqueio de pré-venda.

## GATE-005 — Revisão e gates automatizados

**Estado: APROVADO.** `npm test`: 59/59 aprovados. `npm run lint`: aprovado. `npm run build --workspace=@lumina/api`: aprovado. O primeiro build geral dentro do sandbox falhou por `EPERM` ao criar diretório no `.next`; o rerun fora do sandbox concluiu com sucesso. A integração passou fora do sandbox: 8/8 testes, com URL montada somente para `lumina_task009_test`; nenhum outro banco foi acessado.

## GATE-006 — Testes manuais

**Estado: PENDENTE.** O roteiro `tests/manual/task-017/README.md` e o runner `run-task-017-manual-tests.ps1` foram criados; o parser PowerShell confirmou sintaxe válida. Cenários continuam `BLOQUEADO` (ainda não executados), pois dependem de API local, compra sintética e inspeção humana da cópia personalizada. O relatório correspondente não declara aprovação.
