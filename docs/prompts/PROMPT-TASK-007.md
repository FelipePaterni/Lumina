# Prompt — TASK-007: Domínio e administração do catálogo

Execute exclusivamente a `TASK-007`. Leia `AGENTS.md`, `README.md`, `TASKS.md`, ADR-001, ADR-002, ADR-003 e a evidência da TASK-006. Só comece se TASK-006 estiver `DONE` e os gates anteriores passarem. Trabalhe em `feature/TASK-007-catalogo-administracao`; nunca em `main`; só então use `IN_PROGRESS`.

Implemente obra, autor, editora, categorias múltiplas, edições física/digital, ISBN válido, preço e visibilidade. Cada edição deve possuir preço e disponibilidade próprios; ocultar uma obra/edição não remove acesso de quem já adquiriu. Entregue CRUD autorizado à Gestão de Catálogo/Admin e páginas de catálogo coerentes com RF-003–005.

Mude somente `modules/catalog/**`, `features/catalog/**`, `database/**`, `tests/**catalog/**` e `TASKS.md`. Teste múltiplas categorias, ISBN, preços/versões independentes, visibilidade e RBAC. Não implemente arquivos digitais, upload, inventário, carrinho, checkout, buscas avançadas, avaliações ou regras de compra.

Não invente metadados, contratos ou permissões fora do README. Se uma mudança necessária cair fora do Scope Guard, pare com `SCOPE ESCALATION`. Execute gates aplicáveis, commits convencionais e o relatório completo antes de `DONE`.
