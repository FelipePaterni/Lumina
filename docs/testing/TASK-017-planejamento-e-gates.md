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
- `pdf-lib` e `jszip` não estão instalados nem declarados no workspace (`npm ls pdf-lib jszip --depth=0` retornou árvore vazia). Transformar PDF e editar o pacote ZIP EPUB sem ferramentas próprias exigiria implementar parsers de formatos complexos, com risco de arquivo inválido, perda de conteúdo ou exposição do original.

## GATE-003 — Planejamento mínimo e bloqueio de escopo

O plano técnico requer leitura restrita do original privado, personalização de PDF e metadados EPUB, armazenamento somente da cópia derivada, biblioteca a partir de compras digitais confirmadas, bloqueio de lançamento futuro, links temporários renováveis e auditoria de falhas sem PII. Não é necessário alterar schema se os direitos forem derivados dos pedidos e os eventos forem gravados pela auditoria existente. O registro de `LibraryModule` em `AppModule` será incidental e documentado.

Para processar os formatos sem inventar implementações inseguras, são necessárias dependências runtime para manipular PDF e ZIP/EPUB. Esses manifestos estão fora do escopo autorizado atual. A etapa 003 está bloqueada até decisão sobre a ampliação.

## SCOPE ESCALATION

TASK: TASK-017
Necessidade identificada: acrescentar bibliotecas de runtime para personalizar PDFs e editar os pacotes EPUB com segurança.
Motivo: o workspace não possui processador PDF nem biblioteca ZIP/EPUB; processamento próprio de formatos binários não é uma solução segura nem proporcional.
Arquivos/módulos afetados: `apps/api/package.json`, `package-lock.json`; incidental necessário `apps/api/src/app.module.ts` para registrar `LibraryModule`.
Allowed Changes atual: `modules/library/**`; `modules/watermark/**`; `storage/**`; `features/library/**`; `tests/**`; `TASKS.md`.
Forbidden Changes relacionado: DRM; arquivo original público; reembolso.
Por que não é incidental: adicionar dependências runtime altera o manifesto e lockfile, supply chain e auditoria de segurança do produto.
Impacto se não realizada: não é possível cumprir o DoD de cópias PDF/ePub personalizadas mantendo originais privados.
Alternativas: (1) ampliar o escopo para manifestos e lockfile e validar as novas dependências; (2) aprovar ferramentas externas já disponíveis no ambiente de execução e sua portabilidade; (3) redefinir requisito para um único formato/saída, decisão que alteraria a aceitação.
Recomendação: autorizar apenas `apps/api/package.json` e `package-lock.json` para dependências de PDF e ZIP/EPUB; tratar o registro em `AppModule` como incidental mínimo. Nenhuma migration ou mudança de schema é proposta.
Decisão necessária: aprovar ou recusar a ampliação do `ALLOWED_CHANGES` para `apps/api/package.json` e `package-lock.json`.

## Estado dos gates

| Gate | Estado | Evidência |
|---|---|---|
| GATE-001 — Prontidão | APROVADO | Dependência, critérios, ADR, branch e árvore inicial conferidos. |
| GATE-002 — Contexto histórico | APROVADO | Código, schema, testes relacionados e baseline registrados acima. |
| GATE-003 — Planejamento mínimo | BLOQUEADO | Scope Escalation acima aguarda decisão sobre manifestos de dependências. |
| GATE-004 — Implementação controlada | PENDENTE | Não iniciada. |
| GATE-005 — Revisão e gates automatizados | PENDENTE | Não iniciada. |
| GATE-006 — Testes manuais | PENDENTE | Não iniciada. |
| GATE-007 — Conclusão e rastreabilidade | PENDENTE | Não iniciada. |

## Scope Guard

Nenhuma alteração de produto foi realizada. `TASKS.md` foi atualizado para `BLOCKED` pelo impedimento de escopo. O plano e este relatório são artefatos incidentais mínimos para registrar gates e bloqueio conforme AGENTS.md.
