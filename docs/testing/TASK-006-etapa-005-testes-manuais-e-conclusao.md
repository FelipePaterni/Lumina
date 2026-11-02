# TASK-006 — Etapa 005 — Testes manuais e conclusão

## Identificação

- TASK: TASK-006 — Checkpoint de transição PHASE-01
- Etapa: 005 — Testes manuais e conclusão
- Branch: `chore/TASK-006-recontextualizacao`
- GATE anterior: GATE-004 aprovado
- Responsável: responsável humano do ambiente Windows/WSL
- Status inicial dos cenários: `NAO EXECUTADO`

## Regras de segurança

Usar somente dados sintéticos locais. Não registrar senhas, JWTs, tokens, e-mails completos, PII, cabeçalhos Authorization, `.env` ou arquivos originais. Registrar apenas status HTTP, flags, contagens e mensagens sanitizadas.

## Preparação

```powershell
wsl
cd /mnt/c/Users/felip/Desktop/Lumina
git status --short --branch
git log -1 --oneline
docker compose up --build -d
docker compose ps
```

Esperado: branch dedicada, árvore controlada, PostgreSQL `healthy`, API em `localhost:3001` e Web em `localhost:3000`.

## Cenários manuais

### MT-006-01 — Superfícies locais

- Pré-condições: Docker ativo e Compose iniciado.
- Comandos: `curl -i http://localhost:3000`; `curl -i http://localhost:3001`.
- Procedimento: confirmar resposta da Web e ausência de rota de negócio prematura na raiz da API.
- Esperado: Web responde; API permanece ativa; nenhum segredo/PII aparece.
- Evidência: códigos HTTP, estado dos contêineres e observações sanitizadas.
- Resultado: `NAO EXECUTADO`.

### MT-006-02 — Acesso administrativo sem credencial

- Pré-condições: API ativa.
- Comandos: `curl -i http://localhost:3001/admin/users`; `curl -i http://localhost:3001/admin/audit-logs`.
- Procedimento: chamar as rotas sem `Authorization`.
- Esperado: ambas retornam `401 Unauthorized`.
- Evidência: endpoint abreviado e código HTTP.
- Resultado: `NAO EXECUTADO`.

### MT-006-03 — Cliente autenticado em rota administrativa

- Pré-condições: cliente sintético confirmado; JWT somente em memória.
- Comando: chamada a `/admin/users` com papel `CUSTOMER` e token local não registrado.
- Procedimento: acessar rota exclusiva de Admin.
- Esperado: `403 Forbidden`; nenhuma informação administrativa retornada.
- Evidência: papel, endpoint abreviado, código HTTP e corpo sanitizado.
- Resultado: `NAO EXECUTADO`.

### MT-006-04 — Motivo e auditoria de ação sensível

- Pré-condições: Admin sintético do seed local; token somente em memória.
- Procedimento: executar alteração autorizada com `reason` sintético e consultar apenas `action`, `target_type` e `has_reason`.
- Esperado: ação aceita; motivo presente; auditoria sem PII.
- Evidência: status HTTP e campos não pessoais.
- Resultado: `NAO EXECUTADO`.

### MT-006-05 — Desativação e reativação de cliente

- Pré-condições: cliente sintético confirmado, sem usar o único Admin.
- Procedimento: solicitar desativação e reativar dentro da carência; consultar apenas flags/datas booleanizadas.
- Esperado: desativação e reativação aceitas dentro do período configurado.
- Evidência: códigos HTTP, `is_active` e flags de data.
- Resultado: `NAO EXECUTADO`.

### MT-006-06 — Isolamento Web/API e ausência de segredos

- Pré-condições: repositório local.
- Procedimento: inspecionar dependências da Web, referências a banco em `apps/web`, `env("DATABASE_URL")` no schema e `.env` não versionado.
- Esperado: Web não acessa banco diretamente; nenhum segredo ou PII real encontrado.
- Evidência: somente `NO_MATCHES`, nomes de variáveis e status Git.
- Resultado: `NAO EXECUTADO`.

## Revisão final

O plano, a matriz e o relatório automatizado estão presentes. O Scope Guard foi respeitado: nenhum código de catálogo/comércio foi alterado. A aprovação depende de evidência humana; automação não substitui essa execução.

## Estado da etapa

**AGUARDANDO TESTES MANUAIS.** Esta etapa não declara aprovação humana nem altera `TASKS.md`.
