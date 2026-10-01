# Prompt — TASK-001: Inicializar estrutura e qualidade

Você executará exclusivamente a `TASK-001` do repositório Lumina Livros. Antes de editar, leia integralmente `AGENTS.md`, `README.md`, `TASKS.md`, ADR-001, ADR-002 e ADR-006, depois inspecione código e testes existentes. A versão desses arquivos no repositório é a fonte de verdade; este prompt não a substitui.

Confirme que a TASK-001 é a primeira `READY`, não tem dependências, possui Scope Guard completo e que você não está em `main`. Crie/use a branch `feature/TASK-001-inicializar-estrutura` e só então altere `READY` para `IN_PROGRESS`.

Implemente somente a fundação definida: monólito modular em camadas com projetos web Next.js/React e API NestJS/TypeScript, ferramentas de build/lint/teste, convenções mínimas, Dockerfiles e Docker Compose local reproduzível. A composição deve iniciar os serviços locais documentados, sem segredos nem dados reais incorporados. Documente comandos nativos e Docker.

Não implemente persistência, entidades de domínio, autenticação, catálogo, regras de negócio, integrações externas ou qualquer funcionalidade de TASK posterior. Restrinja mudanças aos arquivos-raiz de build/Docker, `apps/**`, `packages/**`, `tests/**`, documentação de execução e `TASKS.md`.

Execute e registre build, lint, testes vazios/da fundação e inicialização da composição Docker. Se uma dependência necessária, uma decisão técnica ou o Scope Guard não bastar, pare e emita o formato `BLOCKER` ou `SCOPE ESCALATION` de `AGENTS.md`; não invente solução. Ao concluir, faça commits Conventional Commits exclusivos da TASK, siga `IN_REVIEW → DONE` somente com gates verdes e entregue o relatório obrigatório de `AGENTS.md`.
