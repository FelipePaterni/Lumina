# Sequência de compra Pix

```mermaid
sequenceDiagram
  participant C as Cliente
  participant L as Lumina
  participant S as Stripe
  C->>L: Checkout
  L->>L: Valida elegibilidade e reserva licença (24h)
  L->>S: Cria cobrança Pix
  S-->>C: QR code/instruções Pix
  S->>L: Webhook assinado de confirmação
  L->>L: Deduplica evento, consome licença e atualiza itens
  L-->>C: E-mail/status; item lançado liberado
```
