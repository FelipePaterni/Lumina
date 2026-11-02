# Roteiro manual TASK-007

Pré-condições: GATE-005 aprovado, `docker compose up --build`, API em `http://localhost:3001` e Web em `http://localhost:3000`. Usar apenas dados sintéticos e credencial administrativa de desenvolvimento em memória.

| ID | Cenário | Procedimento | Resultado esperado | Status inicial |
|---|---|---|---|---|
| MT-007-01 | Catálogo público | `GET /works`; repetir com `?search=termo-sintetico` e categoria existente | HTTP 200; obras visíveis, busca por título/autor e vazio acessível | NAO EXECUTADO |
| MT-007-02 | Detalhe público | `GET /works/{slug}` para obra visível e oculta | Visível retorna 200; oculta não revela dados | NAO EXECUTADO |
| MT-007-03 | CRUD autorizado | ADMIN/CATALOG cria obra com duas categorias e edições física/digital | HTTP 201; categorias múltiplas e preços próprios preservados | NAO EXECUTADO |
| MT-007-04 | ISBN inválido | Enviar criação com ISBN sintético inválido | HTTP 400/422; nenhum registro parcial | NAO EXECUTADO |
| MT-007-05 | RBAC | CUSTOMER tenta `POST/PATCH /works` | HTTP 403; nenhum registro alterado | NAO EXECUTADO |
| MT-007-06 | Visibilidade e auditoria | CATALOG oculta e reexibe uma obra com motivo sintético | Catálogo público respeita visibilidade; auditoria registra ação sem PII | NAO EXECUTADO |
| MT-007-07 | Interface responsiva | Abrir Web em desktop e viewport mobile; usar teclado no campo de busca | Conteúdo legível, busca operável por teclado, sem overflow horizontal | NAO EXECUTADO |

Comando de pré-condição (não aprova cenários):

```powershell
.\tests\manual\task-007\run-task-007-manual-tests.ps1 -CheckOnly
```

O relatório gerado deve ser revisado humanamente antes de qualquer mudança de status.
