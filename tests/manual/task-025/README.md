# TASK-025 — roteiro manual

Use uma instância local com o banco isolado `lumina_task009_test` e dados sintéticos. O script `run-task-025.ps1` faz apenas GETs não destrutivos às cinco rotas públicas de aplicação, mede o tempo de resposta HTTP e grava um relatório sem corpos de resposta, credenciais ou dados de titulares. A métrica de renderização continua sendo coletada no Chrome estável conforme README §6.1.

Para provisionar logins sintéticos locais, primeiro aplique migrations no banco isolado com `npm run db:migrate` usando `TASK009_TEST_DATABASE_URL`; valide que o nome do banco é exatamente `lumina_task009_test`. Depois execute `node tests/manual/task-025/seed-role-accounts.mjs`. O seeder cria/atualiza somente `task025-admin@example.invalid` (`ADMIN`), `task025-catalog@example.invalid` (`CATALOG`) e `task025-stock@example.invalid` (`STOCK`), gera senhas aleatórias e as imprime uma vez no terminal. Não grava credenciais em arquivo ou relatório. Ele aborta se o destino não for o banco local de teste. Para confirmar logins sem imprimir tokens, defina opcionalmente `$env:TASK025_API_BASE='http://localhost:3001'` antes de executar o seeder. Para que o Web em `localhost:3000` autentique contra esse banco, a API em `localhost:3001` deve apontar temporariamente para `lumina_task009_test`.

```powershell
./tests/manual/task-025/run-task-025.ps1
```

Parâmetros disponíveis: `-WebBaseUrl` e `-ApiBaseUrl`. A execução não faz login, não altera dados e não substitui a revisão humana. Em Chrome, revisar nos viewports 390×844, 768×1024 e 1366×768: navegação por teclado/foco, overflow horizontal, conteúdo principal, estados de carregamento/vazio/erro, links de painéis e feedback para conexão indisponível. Para cada rota, descartar uma navegação de aquecimento e registrar cinco tempos até conteúdo principal visível e término da requisição de dados; cada amostra deve ser ≤20 s.

Os cenários visuais e medições de navegador começam como `NAO EXECUTADO`; não aprovar por inferência a partir de resposta HTTP. Para registrar evidência humana, atualizar o relatório em `docs/testing/TASK-025-testes-manuais-resultado.md` após revisão do responsável. Edge e Firefox permanecem necessários para verificar as duas versões mais recentes e dependem de navegadores disponíveis no ambiente de revisão.
