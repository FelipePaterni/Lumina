# Roteiro manual TASK-009

Pré-condições: GATE-005 aprovado, PostgreSQL/migrações aplicados, API em `http://localhost:3001`, containers ativos e uma edição física e uma edição digital sintéticas disponíveis. Use somente dados fictícios. O script registra apenas status HTTP e não grava tokens, senhas, conteúdo de arquivos ou PII.

Para obter os IDs sem expor dados sensíveis, consulte a API de catálogo e selecione manualmente os IDs das edições sintéticas. Mantenha o token somente em memória no terminal.

| ID | Objetivo | Pré-condições | Procedimento/comandos | Resultado esperado | Evidência/status |
|---|---|---|---|---|---|
| MT-009-01 | Ajustar estoque físico válido | Token ADMIN ou STOCK; `EDITION_ID` físico | `PATCH /inventory/$EDITION_ID/physical` com `{"stock":5,"reason":"Teste sintético TASK-009"}`; depois `GET /inventory/$EDITION_ID` | HTTP 200; estoque 5; movimento registrado; auditoria correspondente | Registrar HTTP, valor e ação de auditoria; inicial `NAO EXECUTADO` |
| MT-009-02 | Rejeitar estoque físico negativo | Token ADMIN ou STOCK; `EDITION_ID` físico | Enviar `stock:-1` | HTTP 400; estoque anterior permanece inalterado | Registrar HTTP e mensagem sanitizada; inicial `NAO EXECUTADO` |
| MT-009-03 | Configurar licença digital numerada | Token ADMIN ou STOCK; `EDITION_ID` digital | `PATCH /inventory/$EDITION_ID/digital` com `{"limit":10,"reason":"Teste sintético TASK-009"}`; consultar inventário | HTTP 200; limite 10; alocações não excedem o limite; auditoria registrada | Registrar HTTP e valores; inicial `NAO EXECUTADO` |
| MT-009-04 | Configurar licença digital ilimitada | Token ADMIN ou STOCK; `EDITION_ID` digital | Enviar `limit:null` com motivo sintético | HTTP 200; limite retorna `null`; auditoria registrada | Registrar HTTP e valor `null`; inicial `NAO EXECUTADO` |
| MT-009-05 | Rejeitar limite digital inválido | Token ADMIN ou STOCK; `EDITION_ID` digital | Enviar `limit:-1` ou texto não numérico | HTTP 400; limite anterior permanece inalterado | Registrar somente HTTP/mensagem sanitizada; inicial `NAO EXECUTADO` |
| MT-009-06 | Negar alteração para CUSTOMER | Token CUSTOMER válido; edição sintética | Repetir PATCH de estoque ou licença com Bearer CUSTOMER | HTTP 403; nenhum dado alterado; nenhuma auditoria de sucesso criada | Registrar HTTP e estado antes/depois; inicial `NAO EXECUTADO` |
| MT-009-07 | Criar versão de ativo privado | Token ADMIN ou CATALOG; `EDITION_ID` digital | `POST /catalog/assets/$EDITION_ID/versions` com conteúdo sintético pequeno em Base64, MIME permitido, extensão `txt`, motivo | HTTP 201/200; resposta não contém caminho físico nem conteúdo original; versão e checksum retornados; auditoria registrada | Registrar campos retornados sanitizados; inicial `NAO EXECUTADO` |
| MT-009-08 | Rejeitar Base64 inválido | Token ADMIN ou CATALOG; edição digital | Enviar `contentBase64:"conteudo-invalido"` | HTTP 400; nenhum arquivo/versão criado | Registrar HTTP e mensagem sanitizada; inicial `NAO EXECUTADO` |
| MT-009-09 | Versionar sem expor original | Pelo menos duas versões sintéticas | Criar segunda versão e consultar `GET /catalog/assets/$EDITION_ID` | Versões numeradas e históricas; listagem não expõe `storageKey`; não existe rota pública de download | Registrar IDs de versão, quantidade e HTTP; inicial `NAO EXECUTADO` |
| MT-009-10 | Bloquear acesso público ao ativo | API ativa; ID digital sintético | Tentar `GET /catalog/assets/$EDITION_ID` sem Authorization e tentar caminho físico presumido | Sem token: HTTP 401; nenhum endpoint público de arquivo responde com conteúdo | Registrar apenas códigos HTTP; inicial `NAO EXECUTADO` |

## Comandos PowerShell de apoio

```powershell
$api = "http://localhost:3001"
$headers = @{ Authorization = "Bearer $token" }
$body = @{ stock = 5; reason = "Teste sintético TASK-009" } | ConvertTo-Json
Invoke-RestMethod "$api/inventory/$physicalEditionId/physical" -Method Patch -Headers $headers -ContentType "application/json" -Body $body
Invoke-RestMethod "$api/inventory/$physicalEditionId" -Headers $headers
```

O token, `$physicalEditionId` e `$digitalEditionId` devem existir somente na sessão do PowerShell e não devem ser gravados no relatório.
