# TASK-024 — roteiro manual

## Objetivo e preparação

Validar solicitação e reativação de conta, avisos simulados, isolamento Admin do painel técnico e ausência de PII nas respostas. O preparador cria contas `@example.invalid` com senhas aleatórias em memória, faz login real e usa somente `lumina_task009_test`; não lê nem apaga arquivos originais. As contas de teste permanecem no banco isolado. O token e os dados pessoais sintéticos não são escritos no relatório.

Pré-condições:

- PostgreSQL local saudável e banco `lumina_task009_test` migrado.
- API compilada e PowerShell 7 disponível.
- Web local atual em `http://localhost:3000` para o cenário HTTP; navegação visual manual obrigatória.
- Execução na raiz do repositório: `node --env-file=.env tests/manual/task-024/prepare-and-run.mjs`. Se necessário, `TASK009_TEST_DATABASE_URL` deve apontar somente para `lumina_task009_test`; host fora de loopback ou banco diferente é recusado.
- A janela pode ser ajustada por `ACCOUNT_DELETION_GRACE_PERIOD_DAYS`; sem variável, o padrão é 30 dias. Configuração deve ser inteira positiva.

O preparador mantém senhas e tokens apenas em memória, cria quatro contas sintéticas, inicia a API numa porta loopback temporária, executa o roteiro PowerShell e encerra a API. O roteiro deativa e reativa somente o cliente sintético criado nesta execução. Cada execução gera relatório sanitizado em `docs/testing/TASK-024-testes-manuais-resultado.md`.

## Cenários HTTP

Os status começam como `NAO EXECUTADO`; o script gera `APROVADO`, `REPROVADO` ou `BLOQUEADO` somente com evidência observada.

| ID | Objetivo | Procedimento | Resultado esperado | Status inicial |
|---|---|---|---|---|
| MT-024-API-01 | Recusar visitante | GET sem token em `/admin/observability/dashboard`. | HTTP 401. | NAO EXECUTADO |
| MT-024-API-02 | Resumo agregado Admin | GET com Admin e validar saúde, estados da outbox, alertas e agregados de conta. | HTTP 200; campos agregados presentes. | NAO EXECUTADO |
| MT-024-SEC-01 | Não expor PII | Examinar nomes de campos da resposta Admin sem registrar payload. | Sem e-mail, nome, telefone, CPF, endereço, ID, motivo ou conteúdo de notificação. | NAO EXECUTADO |
| MT-024-SEC-02 | Isolar papel Admin | GET com Catálogo, Estoque e Cliente. | Cada chamada retorna HTTP 403. | NAO EXECUTADO |
| MT-024-API-03 | Solicitar desativação | Cliente sintético solicita desativação; Admin consulta agregados. | HTTP 201, data futura e aumento do total pendente sem identificação pessoal. | NAO EXECUTADO |
| MT-024-API-04 | Reativar e confirmar avisos | Mesmo cliente sintético reativa; conferir estado agregado e contagem total de eventos. | HTTP 201, solicitação sai do total pendente e ao menos quatro eventos de notificação ficam persistidos. | NAO EXECUTADO |
| MT-024-WEB-01 | Carregar painel web | GET `/dashboard` na Web local. | HTTP 200. | NAO EXECUTADO |

## Cenários de interface — revisão humana

Abrir `/dashboard` com a versão atual da Web; entrar como Admin sintético. Revisar os painéis e a seção **Operação**, conferir estados de API/banco, contagens por estado, alertas, agregados e próxima data. Confirmar que não há nomes, e-mails, IDs, motivos ou conteúdo de e-mail. Testar estado vazio ou indisponibilidade do banco apenas em ambiente isolado, sem desligar serviços compartilhados. Sair e autenticar como Catálogo, Estoque e Cliente: a opção Operação não aparece para os demais papéis. Registrar resultado e evidência sanitizada; não aprovar sem observação humana.

| ID | Cenário | Resultado esperado | Resultado/evidência humana | Status inicial |
|---|---|---|---|---|
| MT-024-UI-01 | Revisar seção Operação como Admin | Métricas e alertas agregados legíveis; sem PII; prazos vencidos aparecem como revisão, sem exclusão automática. | Preencher após observar. | NAO EXECUTADO |
| MT-024-UI-02 | Isolar seção por papel | Operação visível somente ao Admin. | Preencher após observar. | NAO EXECUTADO |
| MT-024-UI-03 | Estado vazio/indisponível | Valores vazios ou indisponíveis não aparecem como zero inventado; erros não revelam detalhes. | Preencher após observar. | NAO EXECUTADO |

## Critério de revisão

A aprovação dos cenários HTTP não substitui a revisão visual humana. O responsável deve revisar o relatório sanitizado e confirmar os cenários MT-024-UI-01 a MT-024-UI-03 antes de GATE-006/GATE-007 e `DONE`.
