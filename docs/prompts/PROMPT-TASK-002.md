# Prompt — TASK-002: Base de persistência e migrações

Execute exclusivamente a `TASK-002` do Lumina Livros. Leia `AGENTS.md`, `README.md`, `TASKS.md`, ADR-002, o resultado e os testes da TASK-001 antes de qualquer alteração. Confirme que TASK-001 está `DONE`, seus artefatos existem, seus testes continuam verdes e que a TASK-002 é a primeira elegível. Trabalhe em `feature/TASK-002-persistencia-migracoes`, nunca em `main`, e só depois atualize o estado para `IN_PROGRESS`.

Configure a infraestrutura PostgreSQL da API, convenções de acesso e auditoria temporal, configuração local e uma migração baseline controlada. O banco deve ser acessado apenas pela infraestrutura/API, nunca diretamente pela camada web. Implemente migrações reversíveis e testes de conexão, subida, descida e rollback em banco isolado.

Altere somente `apps/api/src/infrastructure/persistence/**`, `database/**`, `tests/integration/persistence/**` e `TASKS.md`. Não crie módulos de domínio, dados reais, serviços externos, autenticação, catálogo ou endpoints funcionais. Não assuma esquema futuro além do baseline tecnicamente necessário; se a estrutura exigida não estiver definida, pare e reporte o blocker.

Execute os gates aplicáveis, especialmente migrações sobe/desce, rollback, integração e regressão da fundação. Classifique cada mudança, faça commits Conventional Commits da TASK e só marque `DONE` após todos os gates. Entregue o relatório padronizado do `AGENTS.md`.
