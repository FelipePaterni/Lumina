# TASK-029 — validação manual de rotas

Data: 2026-11-22
Resumo: 0/31 rotas responderam HTTP 200.

| Cenário | Estado | Evidência |
|---|---|---|
| GET / | BLOQUEADO | Servidor Web indisponível |
| GET /livros/smoke-book | BLOQUEADO | Servidor Web indisponível |
| GET /livros/smoke-book/avaliar | BLOQUEADO | Servidor Web indisponível |
| GET /bundles | BLOQUEADO | Servidor Web indisponível |
| GET /bundles/00000000-0000-4000-8000-000000000001 | BLOQUEADO | Servidor Web indisponível |
| GET /entrar | BLOQUEADO | Servidor Web indisponível |
| GET /criar-conta | BLOQUEADO | Servidor Web indisponível |
| GET /confirmar-email | BLOQUEADO | Servidor Web indisponível |
| GET /recuperar-senha | BLOQUEADO | Servidor Web indisponível |
| GET /redefinir-senha | BLOQUEADO | Servidor Web indisponível |
| GET /carrinho | BLOQUEADO | Servidor Web indisponível |
| GET /checkout | BLOQUEADO | Servidor Web indisponível |
| GET /pedidos/00000000-0000-4000-8000-000000000002 | BLOQUEADO | Servidor Web indisponível |
| GET /pedidos/00000000-0000-4000-8000-000000000002/rastreamento | BLOQUEADO | Servidor Web indisponível |
| GET /biblioteca | BLOQUEADO | Servidor Web indisponível |
| GET /wishlist | BLOQUEADO | Servidor Web indisponível |
| GET /minha-conta | BLOQUEADO | Servidor Web indisponível |
| GET /minha-conta/pedidos | BLOQUEADO | Servidor Web indisponível |
| GET /dashboard | BLOQUEADO | Servidor Web indisponível |
| GET /catalog/dashboard | BLOQUEADO | Servidor Web indisponível |
| GET /warehouse/dashboard | BLOQUEADO | Servidor Web indisponível |
| GET /operations/dashboard | BLOQUEADO | Servidor Web indisponível |
| GET /admin/catalogo | BLOQUEADO | Servidor Web indisponível |
| GET /admin/catalogo/00000000-0000-4000-8000-000000000003 | BLOQUEADO | Servidor Web indisponível |
| GET /admin/bundles | BLOQUEADO | Servidor Web indisponível |
| GET /admin/cupons | BLOQUEADO | Servidor Web indisponível |
| GET /admin/frete | BLOQUEADO | Servidor Web indisponível |
| GET /admin/usuarios | BLOQUEADO | Servidor Web indisponível |
| GET /admin/reembolsos | BLOQUEADO | Servidor Web indisponível |
| GET /admin/avaliacoes | BLOQUEADO | Servidor Web indisponível |
| GET /admin/auditoria | BLOQUEADO | Servidor Web indisponível |

A verificação testa apenas a resposta HTTP da página; não autentica contas nem substitui revisão visual dos fluxos.
Nesta execução, o servidor local não foi alcançado; os cenários sem resposta foram registrados como BLOQUEADO.
