# TASK-023 — roteiro manual de painéis

## Objetivo e pré-condições gerais

Validar os painéis Admin, Catálogo e Estoque com contas e dados sintéticos, incluindo isolamento por papel, estado vazio e sessão. Use apenas `lumina_task009_test`, uma API local e a aplicação web local. Não altere pedidos, cupons ou inventário durante a revisão.

- Build e testes de integração da TASK-023 aprovados; banco isolado migrado.
- API disponível em `http://localhost:3001` e Web em `http://localhost:3000` (ajuste os parâmetros se necessário).
- Contas sintéticas com papéis `ADMIN`, `CATALOG`, `STOCK` e `CUSTOMER`; tokens temporários mantidos somente em memória.
- Execute o roteiro HTTP em PowerShell no Windows. Serviços em WSL podem ser acessados por `localhost` quando o encaminhamento local estiver ativo; confirme primeiro a conectividade. O script não cria usuários nem altera dados.
- Para cenários de interface, use navegador no host com acesso à aplicação web. Não registre tokens, IDs, e-mails, dados de clientes ou valores de resposta.

## Preparação e comando executável

Inicie a API e a Web conforme os comandos documentados no projeto. Confirme a conectividade sem enviar credenciais:

```powershell
Test-NetConnection localhost -Port 3001
Test-NetConnection localhost -Port 3000
```

Leia os tokens das contas sintéticas em variáveis temporárias no PowerShell e invoque o script. Não os cole em arquivos nem no histórico de comandos:

```powershell
& .\tests\manual\task-023\run-task-023-manual-tests.ps1 `
  -AdminToken $adminToken `
  -CatalogToken $catalogToken `
  -StockToken $stockToken `
  -CustomerToken $customerToken `
  -ApiBaseUrl 'http://localhost:3001' `
  -WebBaseUrl 'http://localhost:3000'
```

O script grava o relatório sanitizado em `docs/testing/TASK-023-testes-manuais-resultado.md`. Ele registra status HTTP, estrutura e evidência resumida; omite corpo das respostas e credenciais. A execução gera status verificáveis para os cenários HTTP abaixo, sem substituir a revisão visual humana.

## Cenários HTTP automatizados pelo roteiro

Para cada cenário: **pré-condições** são API/Web locais disponíveis e tokens sintéticos acima; **comando** é a invocação do script de preparação. O campo “resultado/evidência” deve ser preenchido pelo relatório do script; os status abaixo começam em `NAO EXECUTADO`.

| ID | Objetivo | Procedimento | Resultado esperado | Resultado/evidência | Status inicial |
|---|---|---|---|---|---|
| MT-023-API-01 | Confirmar os três painéis para Admin | Executar o script; ele consulta `/admin/dashboard`, `/catalog/dashboard` e `/warehouse/dashboard` com token ADMIN. | HTTP 200 nos três; payloads contêm somente os agregados documentados. | Relatório: status HTTP e presença dos campos agregados. | NAO EXECUTADO |
| MT-023-API-02 | Isolar papel Catálogo | Executar o script; ele consulta rota própria e rotas Admin/Estoque com token CATALOG. | HTTP 200 em `/catalog/dashboard`; HTTP 403 nas demais. | Relatório: códigos HTTP por rota, sem resposta bruta. | NAO EXECUTADO |
| MT-023-API-03 | Isolar papel Estoque | Executar o script; ele consulta rota própria e rotas Admin/Catálogo com token STOCK. | HTTP 200 em `/warehouse/dashboard`; HTTP 403 nas demais. | Relatório: códigos HTTP por rota, sem resposta bruta. | NAO EXECUTADO |
| MT-023-API-04 | Negar visitante e CUSTOMER | Executar o script; ele chama as três rotas sem token e com token CUSTOMER. | HTTP 401 sem autenticação e HTTP 403 para CUSTOMER em todas as rotas. | Relatório: códigos HTTP por perfil. | NAO EXECUTADO |
| MT-023-API-05 | Preservar compatibilidade do resumo de estoque | Executar o script; comparar `/admin/warehouse/summary` e `/warehouse/dashboard` com token STOCK. | HTTP 200 e agregados equivalentes. | Relatório: status e equivalência estrutural. | NAO EXECUTADO |
| MT-023-API-06 | Verificar ausência de campos pessoais | Executar o script; inspecionar nomes de campos nas três respostas agregadas. | Nenhum campo de e-mail, telefone, endereço, destinatário ou senha. | Relatório: verificação estrutural sem registrar payload. | NAO EXECUTADO |
| MT-023-WEB-01 | Confirmar rota web | Executar o script; ele solicita `GET /dashboard`. | HTTP 200. | Relatório: código HTTP da rota. | NAO EXECUTADO |

## Cenários de interface — revisão humana

**Pré-condições:** Web e API locais acessíveis; as mesmas contas sintéticas; navegador sem sessão prévia. **Comando:** abrir `http://localhost:3000/dashboard`. Para cada cenário, observe o painel e registre somente resultado e evidência sanitizada (por exemplo, papel exibido, estado vazio ou alerta), nunca token ou dado pessoal. Marque `APROVADO` somente após execução e observação humana.

| ID | Objetivo | Procedimento | Resultado esperado | Resultado/evidência humana | Status inicial |
|---|---|---|---|---|---|
| MT-023-UI-01 | Revisar painel Admin | Autenticar como ADMIN; abrir Visão geral e alternar entre os três painéis. | Vendas, clientes ativos, pedidos e Top 5; licenças/cupons; estoque físico/status; sem dados pessoais. | Preencher após observar a UI. | NAO EXECUTADO |
| MT-023-UI-02 | Revisar painel Catálogo | Sair; autenticar como CATALOG; abrir `/dashboard`. | Somente Catálogo disponível, com licenças/cupons e estado vazio/alertas conforme dados. | Preencher após observar a UI. | NAO EXECUTADO |
| MT-023-UI-03 | Revisar painel Estoque | Sair; autenticar como STOCK; abrir `/dashboard`. | Somente Estoque disponível, com estados por status e alertas de estoque zerado/não configurado. | Preencher após observar a UI. | NAO EXECUTADO |
| MT-023-UI-04 | Negar acesso CUSTOMER | Sair; autenticar como CUSTOMER e tentar abrir `/dashboard`. | Acesso negado; nenhum painel é carregado. | Preencher após observar a UI. | NAO EXECUTADO |
| MT-023-UI-05 | Revisar estado vazio | Com ambiente sintético sem resultados para os indicadores, autenticar como ADMIN e verificar Top 5 e alertas. | Estado vazio legível; nenhum valor inventado. | Preencher após observar a UI. | NAO EXECUTADO |
| MT-023-UI-06 | Revisar ciclo da sessão | Autenticar como ADMIN, atualizar a página e depois sair. | Atualização exige nova autenticação; sair limpa a sessão em memória. | Preencher após observar a UI. | NAO EXECUTADO |

## Critério de revisão e tratamento de falha

Compare o relatório HTTP com os cenários observados na interface. Registre falhas, cenário, operação e mensagem sanitizada; não anexe credenciais, dados pessoais ou conteúdo bruto de respostas. Mantenha cada cenário como `NAO EXECUTADO`, `APROVADO`, `REPROVADO` ou `BLOQUEADO`. A aprovação da TASK depende da execução e revisão humana dos cenários obrigatórios; a criação deste roteiro não conta como execução.
