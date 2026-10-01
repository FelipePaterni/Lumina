# Prompt — TASK-010: Wishlist básica

Execute somente a `TASK-010`. Leia as fontes obrigatórias, especialmente RF-008, e valide que TASK-007 está `DONE`, seus artefatos existem e testes passam. Use `feature/TASK-010-wishlist-basica`, não `main`, e altere o estado para `IN_PROGRESS` somente após a Definition of Ready.

Implemente wishlist básica individual: adicionar, remover e consultar apenas a própria lista de obras. Garanta isolamento por usuário e não exponha PII desnecessária.

Mude apenas `modules/wishlist/**`, `features/wishlist/**`, `tests/**wishlist/**` e `TASKS.md`. Teste ownership, inclusão/remoção, duplicação e tentativas de acesso a lista de terceiros. Não crie alerta/notificação de wishlist, checkout, descontos adicionais, relatórios exportáveis ou painéis/métricas; os indicadores pertencem à TASK-023.

Se algum requisito de wishlist estiver ambíguo, registre o blocker; não invente comportamento. Execute os gates, classifique mudanças, faça commits Conventional Commits e entregue o relatório exigido em `AGENTS.md`.
