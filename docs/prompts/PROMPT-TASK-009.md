# Prompt — TASK-009: Inventário e ativos privados

Execute exclusivamente a `TASK-009`. Leia `AGENTS.md`, `README.md`, `TASKS.md`, ADR-004, implementação e testes da TASK-007. Inicie apenas se a dependência estiver `DONE` e verde. Use `feature/TASK-009-inventario-ativos`; jamais `main`; atualize para `IN_PROGRESS` só após validar DoR.

Implemente estoque físico numérico, licenças digitais numéricas ou ilimitadas, movimentos de inventário, upload/versionamento local privado de PDF/ePub e o adaptador de armazenamento do ADR-004. Originais nunca podem ser servidos publicamente. A atualização de versão deve preservar histórico e ficar preparada para notificação/acesso posterior, sem antecipar biblioteca/download. Mudanças de inventário devem gerar auditoria apropriada.

Restrinja mudanças a `modules/catalog/assets/**`, `modules/inventory/**`, `storage/**`, `database/**`, `tests/**` e `TASKS.md`. Teste acesso privado, versões, licença ilimitada/numerada, estoque e validações. Não crie endpoint público de download, marca d'água, pedidos, checkout, entrega de biblioteca ou serviço externo.

Se o armazenamento local exigir contrato ou mudança de infraestrutura fora do ADR-004, pare para decisão. Rode gates aplicáveis, registre resultados reais, faça commits rastreáveis e entregue o relatório de conclusão.
