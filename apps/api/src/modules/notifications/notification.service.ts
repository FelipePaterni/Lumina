import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from "@nestjs/common";
import { OutboxEmail, OutboxEmailStatus } from "@prisma/client";
import { PrismaService } from "../../infrastructure/persistence/prisma.service.js";
import {
  SimulatedEmailNotification,
} from "./notification-event.js";
import { SimulatedEmailTransport } from "./simulated-email-transport.js";

const MAX_ATTEMPTS = 3;
const POLL_INTERVAL_MS = 5_000;
const PROCESSING_LEASE_MS = 60_000;

@Injectable()
export class NotificationService implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(NotificationService.name);
  private poller: NodeJS.Timeout | undefined;
  private draining = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly transport: SimulatedEmailTransport,
  ) {}

  onApplicationBootstrap(): void {
    void this.processPending().catch(() => this.logStorageFailure("WORKER"));
    this.poller = setInterval(() => {
      void this.processPending().catch(() => this.logStorageFailure("WORKER"));
    }, POLL_INTERVAL_MS);
    this.poller.unref();
  }

  onApplicationShutdown(): void {
    if (this.poller) clearInterval(this.poller);
  }

  /** Enqueue and make a best-effort local delivery; source operations never fail on notification errors. */
  async dispatchSimulatedEmail(notification: SimulatedEmailNotification): Promise<void> {
    if (!notification.eventKey || notification.eventKey.length > 160) {
      this.logger.warn(`notification rejected event=${notification.eventType} code=INVALID_EVENT_KEY`);
      return;
    }

    let event: OutboxEmail;
    try {
      event = await this.prisma.outboxEmail.upsert({
        where: { eventKey: notification.eventKey },
        update: {},
        create: {
          eventKey: notification.eventKey,
          eventType: notification.eventType,
          toEmail: notification.toEmail,
          subject: notification.subject,
          body: notification.body,
          deliveryStatus: OutboxEmailStatus.PENDING,
        },
      });
    } catch {
      this.logStorageFailure(notification.eventType);
      return;
    }

    if (event.deliveryStatus === OutboxEmailStatus.SENT || event.deliveryStatus === OutboxEmailStatus.FAILED) {
      return;
    }
    await this.processEvent(event, new Date());
  }

  async processPending(now = new Date()): Promise<void> {
    if (this.draining) return;
    this.draining = true;
    try {
      const events = await this.prisma.outboxEmail.findMany({
        where: {
          OR: [
            { deliveryStatus: OutboxEmailStatus.PENDING },
            { deliveryStatus: OutboxEmailStatus.RETRY, nextAttemptAt: { lte: now } },
            { deliveryStatus: OutboxEmailStatus.PROCESSING, nextAttemptAt: { lte: now } },
          ],
        },
        orderBy: { createdAt: "asc" },
        take: 25,
      });
      for (const event of events) await this.processEvent(event, now);
    } finally {
      this.draining = false;
    }
  }

  private async processEvent(event: OutboxEmail, now: Date): Promise<void> {
    const attemptsBeforeClaim = event.attemptCount;
    const claimFilter = {
      id: event.id,
      deliveryStatus: event.deliveryStatus,
      attemptCount: attemptsBeforeClaim,
      ...(event.deliveryStatus === OutboxEmailStatus.PENDING
        ? {}
        : { nextAttemptAt: { lte: now } }),
    };
    let claim;
    try {
      claim = await this.prisma.outboxEmail.updateMany({
        where: claimFilter,
        data: {
          deliveryStatus: OutboxEmailStatus.PROCESSING,
          attemptCount: { increment: 1 },
          lastAttemptAt: now,
          nextAttemptAt: new Date(now.getTime() + PROCESSING_LEASE_MS),
        },
      });
    } catch {
      this.logStorageFailure(event.eventType);
      return;
    }
    if (claim.count !== 1) return;

    const attempt = attemptsBeforeClaim + 1;
    try {
      await this.transport.deliver({
        toEmail: event.toEmail,
        subject: event.subject,
        body: event.body,
      });
      await this.prisma.outboxEmail.update({
        where: { id: event.id },
        data: {
          deliveryStatus: OutboxEmailStatus.SENT,
          sentAt: now,
          nextAttemptAt: null,
          lastErrorCode: null,
        },
      });
    } catch {
      const terminal = attempt >= MAX_ATTEMPTS;
      const backoffMs = 1_000 * 2 ** (attempt - 1);
      try {
        await this.prisma.outboxEmail.update({
          where: { id: event.id },
          data: {
            deliveryStatus: terminal ? OutboxEmailStatus.FAILED : OutboxEmailStatus.RETRY,
            nextAttemptAt: terminal ? null : new Date(now.getTime() + backoffMs),
            lastErrorCode: "SIMULATED_DELIVERY_FAILED",
          },
        });
      } catch {
        this.logStorageFailure(event.eventType);
      }
      this.logger.warn(`notification delivery failed event=${event.eventType} attempt=${attempt} terminal=${terminal}`);
    }
  }

  private logStorageFailure(eventType: string): void {
    this.logger.warn(`notification persistence failed event=${eventType} code=OUTBOX_STORAGE_FAILURE`);
  }
}
