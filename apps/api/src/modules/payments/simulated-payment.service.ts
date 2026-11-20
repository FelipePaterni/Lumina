import { BadRequestException, Injectable } from "@nestjs/common";
import { PaymentStatus } from "@prisma/client";

@Injectable()
export class SimulatedPaymentService {
  confirm(amountCents: number): { status: PaymentStatus; amountCents: number } {
    if (!Number.isSafeInteger(amountCents) || amountCents < 0) {
      throw new BadRequestException("Valor do pagamento inválido");
    }
    return {
      status: amountCents === 0 ? PaymentStatus.NOT_REQUIRED : PaymentStatus.APPROVED,
      amountCents,
    };
  }
}
