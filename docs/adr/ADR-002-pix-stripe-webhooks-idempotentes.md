# ADR-002 — Pix Stripe e processamento idempotente de webhooks

## Status

ACCEPTED

## Contexto

Pix é o método de pagamento exclusivo da V1. O gateway pode reenviar eventos e pagamentos pendentes reservam licença por 24 horas.

## Problema

Evitar confirmação duplicada, perda de evento e venda acima do limite de licença.

## Alternativas consideradas

1. Stripe com webhook assinado, armazenado e idempotente.
2. Consultar Stripe apenas de forma periódica.
3. Confiar no retorno do navegador como confirmação.

## Decisão

Criar Pix pela Stripe e processar somente webhooks cuja assinatura foi validada. Persistir identificador do evento e executar transação idempotente para pagamento, pedido e licença.

## Justificativa

Webhooks são o mecanismo confiável da integração; a idempotência protege contra repetição e concorrência.

## Consequências

Exige conta Stripe, segredos, ambiente de teste, monitoramento e alerta de falha. Retentativas não podem reenviar efeitos de negócio/e-mails indevidamente.

## RF/RN/RNF/UC relacionados

RF-005–007, RN-002–004, RNF-005, UC-003–005.
