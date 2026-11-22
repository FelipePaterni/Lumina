# TASK-025 — roteiro manual

Use uma instância local com o banco isolado `lumina_task009_test` e dados sintéticos. O script `run-task-025.ps1` faz apenas GETs não destrutivos às cinco rotas públicas de aplicação, mede o tempo de resposta HTTP e grava um relatório sem corpos de resposta, credenciais ou dados de titulares. A métrica de renderização continua sendo coletada no Chrome estável conforme README §6.1.

Para provisionar os logins sintéticos de Catálogo e Estoque, copie a variável `TASK009_TEST_DATABASE_URL` do `.env.example` para o `.env`. A URL deve usar o mesmo usuário/senha locais do PostgreSQL e apontar para `lumina_task009_test`. No PowerShell, carregue essa URL para a sessão e aplique as migrations no banco isolado:

```powershell
$testDatabaseUrlLine = Get-Content .env | Where-Object { $_ -match '^TASK009_TEST_DATABASE_URL=' } | Select-Object -First 1
$env:TASK009_TEST_DATABASE_URL = ($testDatabaseUrlLine -split '=', 2)[1].Trim().Trim('"').Trim("'")
$env:DATABASE_URL = $env:TASK009_TEST_DATABASE_URL
npm run db:migrate
node tests/manual/task-025/seed-role-accounts.mjs
```

O seeder cria/atualiza somente `task025-catalog@example.invalid` (`CATALOG`) e `task025-stock@example.invalid` (`STOCK`). Ele não cria, altera ou redefine o administrador existente. As senhas aleatórias aparecem no terminal logo após a criação das contas, antes da checagem opcional de login; não são gravadas em arquivo ou relatório. Guarde-as antes de fechar o terminal. O script aborta se o destino não for o banco local de teste. Para confirmar os logins pela API sem imprimir tokens, defina opcionalmente `$env:TASK025_API_BASE='http://localhost:3001'` antes de executar o comando.

Com as migrations aplicadas e as contas semeadas, aponte temporariamente a API da Compose ao banco isolado para testar pela Web atual: `docker compose -f docker-compose.yml -f tests/manual/task-025/docker-compose.task025.yml up -d --no-deps api`. Restaurar a API normal depois dos testes com `docker compose up -d --no-deps api`. O override mantém o `.env` privado e desabilita seed automático de clientes.

```powershell
./tests/manual/task-025/run-task-025.ps1
```

Parâmetros disponíveis: `-WebBaseUrl` e `-ApiBaseUrl`. A execução não faz login, não altera dados e não substitui a revisão humana. Em Chrome, revisar nos viewports 390×844, 768×1024 e 1366×768: navegação por teclado/foco, overflow horizontal, conteúdo principal, estados de carregamento/vazio/erro, links de painéis e feedback para conexão indisponível. Para cada rota, descartar uma navegação de aquecimento e registrar cinco tempos até conteúdo principal visível e término da requisição de dados; cada amostra deve ser ≤20 s.

Os cenários visuais e medições de navegador começam como `NAO EXECUTADO`; não aprovar por inferência a partir de resposta HTTP. Para registrar evidência humana, atualizar o relatório em `docs/testing/TASK-025-testes-manuais-resultado.md` após revisão do responsável. Edge e Firefox permanecem necessários para verificar as duas versões mais recentes e dependem de navegadores disponíveis no ambiente de revisão.
