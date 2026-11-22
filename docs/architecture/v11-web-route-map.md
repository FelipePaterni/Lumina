# Mapa de rotas Web V1.1

Todas as telas usam os endpoints existentes da API. A sessão de cliente e a sessão da equipe ficam somente em memória e terminam ao recarregar a página ou sair.

## Loja e cliente

| Rota | Uso |
|---|---|
| `/` | Catálogo com busca, filtros por categoria/idioma/faixa de preço, ordenação e paginação. |
| `/livros/[slug]` | Detalhe da obra, edições, wishlist, carrinho e avaliações. |
| `/livros/[slug]/avaliar` | Acesso direto ao detalhe e formulário de avaliação/denúncia. |
| `/bundles`, `/bundles/[id]` | Descoberta, detalhe e adição de bundle ao carrinho. |
| `/entrar`, `/criar-conta`, `/confirmar-email` | Autenticação, cadastro e confirmação de e-mail. |
| `/recuperar-senha`, `/redefinir-senha` | Recuperação e redefinição de senha. |
| `/carrinho`, `/checkout` | Itens físicos/digitais/bundles, quantidades físicas, cupom, frete e confirmação fictícia. |
| `/pedidos/[id]`, `/pedidos/[id]/rastreamento` | Detalhe por identificador, rastreio e solicitação de cancelamento/reembolso. |
| `/biblioteca` | Aquisições digitais e criação de link temporário com marca d'água. |
| `/wishlist` | Consulta e remoção de itens salvos. |
| `/minha-conta`, `/minha-conta/pedidos` | Dados disponíveis da sessão, reativação/desativação e explicação do limite do histórico. |

## Equipe

| Rota | Uso e papel |
|---|---|
| `/dashboard`, `/catalog/dashboard`, `/warehouse/dashboard`, `/operations/dashboard` | Painéis existentes, com autorização por papel mantida. |
| `/admin/catalogo`, `/admin/catalogo/[id]` | Criar/editar/publicar obras, ajustar estoque/licenças e consultar/adicionar versões de ativos. Admin/Catálogo; estoque apenas Admin/Estoque; ativos apenas Admin/Catálogo. |
| `/admin/bundles` | Listar/criar bundles. Admin/Catálogo. |
| `/admin/cupons` | Listar/criar e ativar/desativar cupons. Admin/Catálogo. |
| `/admin/frete` | Listar/criar e ativar/desativar regras. Admin. |
| `/admin/usuarios` | Listar e alterar papel/status com motivo. Admin. |
| `/admin/reembolsos` | Consultar solicitações, decidir e confirmar devolução. Admin. |
| `/admin/avaliacoes` | Consultar denúncias e remover avaliações com motivo. Admin. |
| `/admin/auditoria` | Consultar logs paginados. Admin. |

## Limites do contrato atual

- A API não lista pedidos por cliente; o detalhe exige um ID conhecido.
- O endpoint de conta não atualiza dados do perfil. A tela apresenta os claims disponíveis e ações de reativação/desativação.
- `GET /works` lista somente obras visíveis; não existe busca administrativa de obras ocultas.
- Bundle pode ser criado/listado/consultado, mas não editado nem removido.
- Atualizar uma obra substitui as edições pelo contrato atual. A UI avisa que referências existentes podem fazer a API recusar a atualização.
- A expedição e o pagamento continuam simulados conforme a V1.

