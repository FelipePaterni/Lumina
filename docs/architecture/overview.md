# Arquitetura detalhada

## Limites de módulos

`identity` administra usuários, papéis, sessão e consentimento. `catalog` controla produtos, arquivos, publicação e CSV. `commerce` contém carrinho, preço, cupom, pedido, bundle e licença. `payments` adapta Stripe e webhooks. `library` autoriza a posse, personaliza e entrega arquivos. `reviews` implementa avaliação/denúncia/moderação. `operations` inclui métricas, auditoria, exclusão e observabilidade.

Apresentação pode chamar apenas casos de uso da aplicação. A aplicação orquestra transações e depende de portas de repositório, relógio, e-mail, pagamento, fila e armazenamento. Domínio não depende de framework ou SDK. Infraestrutura implementa as portas.

## Fluxo crítico de pagamento

1. Checkout valida cliente, propriedade existente, preço/cupom e disponibilidade; cria pedido e reserva temporária de licença.
2. Adaptador Stripe cria cobrança Pix com expiração de 24h.
3. Webhook assinado é persistido pelo ID do evento e processado uma única vez.
4. Confirmação consome licença e libera cada item conforme lançamento. Expiração/falha desfaz reserva.
5. Jobs enviam e-mails e preparam entregas sem estender a transação financeira.

## Proteções transversais

Operações administrativas e alterações de pagamento/moderação são auditadas. A autorização combina papel e propriedade. Arquivos mestre ficam privados. Webhook é validado, rate-limited e monitorado. Dados pessoais não entram em log estruturado exceto identificadores mínimos justificados.
