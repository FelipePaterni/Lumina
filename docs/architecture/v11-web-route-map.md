# Mapa de rotas Web V1.1

As telas de cliente mantêm os contratos atuais. As rotas administrativas usam também os endpoints aditivos de gestão definidos na TASK-030. A sessão de cliente e a sessão da equipe ficam somente em memória e terminam ao recarregar a página ou sair.

## Loja e cliente

| Rota | Uso |
|---|---|
| `/` | Catálogo com busca, filtros por categoria/idioma/faixa de preço, ordenação e paginação. |
| `/livros/[slug]` | Detalhe da obra, edições, wishlist, carrinho e avaliações. |
| `/livros/[slug]/avaliar` | Acesso direto ao detalhe e formulário de avaliação/denúncia. |
| `/bundles`, `/bundles/[id]` | Descoberta, detalhe e adição de bundle ao carrinho. |
| `/entrar`, `/criar-conta`, `/confirmar-email` | Autenticação, cadastro e confirmação de e-mail. |
| `/ativar-equipe` | Definir senha e confirmar e-mail por convite de equipe de uso único. |
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
| `/admin/catalogo`, `/admin/catalogo/[id]` | Criar, buscar, editar e publicar obras visíveis ou ocultas; gerenciar edições e arquivos. Admin/Catálogo. |
| `/warehouse/inventory` | Buscar edições visíveis ou ocultas e ajustar estoque físico/licenças digitais com motivo. Admin/Estoque. |
| `/admin/bundles` | Listar/criar bundles. Admin/Catálogo. |
| `/admin/cupons` | Listar/criar e ativar/desativar cupons. Admin/Catálogo. |
| `/admin/frete` | Listar/criar e ativar/desativar regras. Admin. |
| `/admin/usuarios` | Buscar/paginar usuários, criar convite de equipe e alterar papel/status com motivo. Admin. O link de ativação é exibido uma vez para cópia. |
| `/admin/reembolsos` | Consultar solicitações, decidir e confirmar devolução. Admin. |
| `/admin/avaliacoes` | Consultar denúncias e remover avaliações com motivo. Admin. |
| `/admin/auditoria` | Consultar logs paginados. Admin. |

## Limites do contrato atual

- A API não lista pedidos por cliente; o detalhe exige um ID conhecido.
- O endpoint de conta não atualiza dados do perfil. A tela apresenta os claims disponíveis e ações de reativação/desativação.
- `GET /works` público continua listando somente obras visíveis; as rotas administrativas dedicadas incluem obras ocultas.
- Bundle pode ser criado/listado/consultado, mas não editado nem removido.
- Atualizar uma obra preserva os IDs e referências das edições existentes; ocultar uma edição retira-a de venda sem apagar seu histórico.
- O transporte de e-mail continua simulado; o Admin copia o link de ativação exibido uma vez e o compartilha por um canal externo seguro.
- A expedição e o pagamento continuam simulados conforme a V1.

