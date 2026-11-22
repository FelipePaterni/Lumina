# TASK-025 — planejamento e gates

Data do registro: 2026-11-22. Branch: `chore/TASK-025-readiness`.

## Prontidão e plano

- Dependências confirmadas DONE: TASK-021, TASK-022, TASK-023, TASK-024 e TASK-027. Os artefatos e resultados estão nos relatórios de cada tarefa em `docs/testing/`.
- O responsável definiu a baseline local na seção 6.1 do README: Windows x64, Core i5-13450HX, 16 processadores lógicos, 15,7 GiB RAM; Docker Compose; banco isolado `lumina_task009_test`; três obras sintéticas; sem concorrência; Chrome estável; rotas `/`, `/dashboard`, `/catalog/dashboard`, `/warehouse/dashboard` e `/operations/dashboard`; um aquecimento e cinco amostras por rota; limite de 20 s por amostra e mediana/máximo; viewports 390×844, 768×1024 e 1366×768.
- Essa baseline satisfaz a validação local do RNF-004, sem inferir capacidade de produção. PD-001 permanece aberto para escala produtiva. Safari foi removido dos critérios conforme decisão do responsável; RNF-005 cobre as duas versões mais recentes de Chrome, Edge e Firefox.
- Não se altera API, persistência, schema, migrações, regras de negócio ou contratos. Correções de interface limitadas a feedback de falha, contraste de textos auxiliares e dimensionamento de input em viewport estreito.
- Arquivos primários: `apps/web/**`, `tests/accessibility/**`, `tests/manual/task-025/**`, `docs/testing/TASK-025-*`, `prompts/tasks/task-025/**`, `README.md` e `TASKS.md`, todos autorizados pelo Scope Guard atualizado. Sem alterações incidentais identificadas até o momento.

## Evidências de implementação inicial

- `apps/web/app/globals.css`: `box-sizing: border-box` evita que padding e borda ampliem a busca além do contêiner; cor auxiliar ajustada de `#6d746e` para `#646b65`.
- `apps/web/src/features/dashboard/DashboardPage.tsx`: erro de autenticação agora é exposto em região `role="alert"`.
- `apps/web/src/features/warehouse/WarehousePanel.tsx`: falha de API deixa de manter textos de carregamento como estado vazio.
- `apps/web/app/page.tsx`: catálogo usa a configuração de API da aplicação para permitir execução local reproduzível.
- Teste automatizado dedicado verifica pares de contraste selecionados e semântica/feedback por código. Ele não substitui análise completa de árvore acessível ou revisão visual.

## Matriz de gates

| Gate | Critério | Estado inicial |
|---|---|---|
| GATE-001 | Recontextualização, dependências, branch e Scope Guard | APROVADO por evidência documental e branch própria |
| GATE-002 | Histórico, baseline de testes e pré-condições | APROVADO: `npm test` 96/96; baseline local e serviços conferidos |
| GATE-003 | Plano e riscos | APROVADO: este documento e decisões do responsável |
| GATE-004 | Correções controladas | APROVADO: alterações limitadas e revisadas; sem API/schema |
| GATE-005 | Testes, lint, builds, segurança e diff | APROVADO: ver resultados abaixo |
| GATE-006 | Rotas HTTP, navegadores, responsividade, teclado e medições manuais | BLOQUEADO para revisão humana, papéis/estados autenticados e Edge/Firefox |
| GATE-007 | Revisão, DoD, commits e rastreabilidade | PENDENTE da aprovação/decisão do responsável e encerramento |

## Riscos e bloqueios conhecidos

- Edge e Firefox não estavam disponíveis no inventário do ambiente de navegador usado na inspeção preliminar; não registrar esses navegadores como aprovados sem evidência. A validação das versões-alvo requer ambiente com ambos.
- Chrome medirá renderização real; o script HTTP fornece apenas evidência de disponibilidade e latência de resposta, não substituindo tempos até tela pronta.
- Cenários visuais e leitura humana permanecem pendentes de aprovação do responsável. Estados de sessão/contas dependem de dados sintéticos locais.
- Não executar seed que remova/recrie registros. O banco dedicado deve ser apenas consultado, e qualquer fixture deve ser não destrutiva.

## Resultados automatizados

Comandos executados; todos os resultados abaixo são observados:

| Comando / validação | Resultado |
|---|---|
| `npm run lint` | Código 0, ESLint sem avisos/erros. |
| `npm test` | Código 0, 96/96 passaram. |
| `node --test tests/accessibility/task-025-accessibility.test.mjs` | Código 0, 3/3 passaram. |
| `npm run build --workspace @lumina/api` | Código 0. |
| `npm run build --workspace @lumina/web` | Código 0 após repetir com permissão de gravação em `.next`; todas as seis rotas web geradas. A primeira execução encontrou erro JSX corrigido e a seguinte EPERM do sandbox, sem falha de código na compilação final. |
| Parser PowerShell para `run-task-025.ps1` | Sem erros sintáticos. |
| `tests/manual/task-025/run-task-025.ps1` | Rotas Web/API responderam 200; corpos e exceções omitidos do relatório. |
| `npx prettier --check` nos novos testes/roteiros/relatórios TASK-025 | Código 0; arquivos novos formatados. |
| `git diff --check` | Código 0. |
| Integração de API/banco | Não executada: esta tarefa não alterou API/persistência; dependências de API/banco já aprovadas em TASK-024/027. |

`npm run format:check` (Prettier em todo o repositório) retornou código 1 e reportou 210 arquivos fora do formato, incluindo arquivos preexistentes não relacionados. Os arquivos novos da TASK-025 passaram na verificação direcionada; não foi feita reformatação massiva fora do escopo.

O relatório `TASK-025-testes-manuais-resultado.md` contém 75 medições de tela pronta, com cinco amostras para cada rota em cada viewport; 75/75 ficaram abaixo de 20 s. As rotas protegidas foram medidas sem sessão, mostrando o formulário de login, conforme a definição de pronto do README. O teste HTTP forneceu apenas disponibilidade e latência de rede.

Chrome foi revisado em aba temporária: o link “Painéis da equipe” abriu `/dashboard`; em 390×844, o campo de busca ficou dentro do contêiner após a correção. Quinze verificações DOM (cinco rotas × três viewports) não encontraram largura de documento maior que o viewport. Isso é evidência automatizada/browser-assisted; não constitui aprovação visual humana. Nenhuma conta foi autenticada. Papéis, logout, acesso negado sem chamada API, estados vazios/erro/conexão e teclado ainda precisam de execução/revisão humana. Edge e Firefox não estavam disponíveis.

`GATE-006` e `GATE-007` permanecem pendentes. A tarefa não está concluída; PD-001 também permanece aberto para escala de produção.
