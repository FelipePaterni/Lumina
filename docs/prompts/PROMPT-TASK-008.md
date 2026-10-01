# Prompt — TASK-008: Busca e filtros básicos de catálogo

Execute somente a `TASK-008`. Leia fontes obrigatórias, a implementação/testes da TASK-007 e confirme que ela está `DONE` com artefatos e gates verdes. Use `feature/TASK-008-busca-filtros`; não altere `main`; transite para `IN_PROGRESS` apenas após confirmar o DoR.

Implemente pesquisa por título ou autor, filtros por categoria, idioma, faixa de preço e lançamento, além de paginação. Filtros devem combinar entre si; obras ocultas não podem aparecer; resultado vazio preserva os critérios e oferece experiência acessível/paginada. Respeite requisitos de responsividade e deixe medições de desempenho para o gate próprio, sem presumir que foram atingidas.

Altere somente `modules/catalog/search/**`, `features/catalog/**`, `tests/**catalog/**` e `TASKS.md`. Teste combinações, paginação, ocultação, vazio acessível e consultas relevantes com índices/revisão de plano. Não implemente checkout, inventário, arquivos digitais, regra de avaliações ou rankings por vendas/avaliações; esses rankings pertencem à TASK-027.

Se faltar fonte de dados ou contrato necessário para algum filtro básico, pare e reporte o blocker em vez de criar funcionalidade posterior. Execute gates, commits exclusivos e relatório final de TASK.
