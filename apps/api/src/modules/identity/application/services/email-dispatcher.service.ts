import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../../infrastructure/persistence/prisma.service.js";

@Injectable()
export class EmailDispatcherService {
  constructor(private readonly prisma: PrismaService) {}

  async dispatchSimulatedEmail(
    toEmail: string,
    subject: string,
    body: string,
  ): Promise<void> {
    await this.prisma.outboxEmail.create({
      data: {
        toEmail,
        subject,
        body,
        sentAt: new Date(),
      },
    });
  }
}
