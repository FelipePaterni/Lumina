import { Injectable } from "@nestjs/common";
import { OutboxEmailStatus } from "@prisma/client";
import { PrismaService } from "../../infrastructure/persistence/prisma.service.js";

const OUTBOX_STATUSES = [
  OutboxEmailStatus.PENDING,
  OutboxEmailStatus.PROCESSING,
  OutboxEmailStatus.RETRY,
  OutboxEmailStatus.SENT,
  OutboxEmailStatus.FAILED,
] as const;

@Injectable()
export class ObservabilityDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async summary(now = new Date()) {
    let database = "UP" as "UP" | "UNAVAILABLE";
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      database = "UNAVAILABLE";
    }

    if (database === "UNAVAILABLE") {
      return {
        health: { api: "UP", database },
        notifications: null,
        accountDeletion: null,
        alerts: { failedNotifications: null, expiredProcessingLeases: null },
      };
    }

    const [statusRows, failedNotifications, expiredProcessingLeases, pendingRequests, expiredRequests, nextRequest] = await Promise.all([
      this.prisma.outboxEmail.groupBy({
        by: ["deliveryStatus"],
        _count: { _all: true },
      }),
      this.prisma.outboxEmail.count({ where: { deliveryStatus: OutboxEmailStatus.FAILED } }),
      this.prisma.outboxEmail.count({
        where: {
          deliveryStatus: OutboxEmailStatus.PROCESSING,
          nextAttemptAt: { lte: now },
        },
      }),
      this.prisma.user.count({
        where: { isActive: false, scheduledDeletionAt: { gt: now } },
      }),
      this.prisma.user.count({
        where: { isActive: false, scheduledDeletionAt: { lte: now } },
      }),
      this.prisma.user.findFirst({
        where: { isActive: false, scheduledDeletionAt: { gt: now } },
        orderBy: { scheduledDeletionAt: "asc" },
        select: { scheduledDeletionAt: true },
      }),
    ]);

    const counts = Object.fromEntries(OUTBOX_STATUSES.map((status) => [status, 0])) as Record<OutboxEmailStatus, number>;
    for (const row of statusRows) counts[row.deliveryStatus] = row._count._all;

    return {
      health: { api: "UP", database },
      notifications: counts,
      accountDeletion: {
        pendingRequests,
        expiredRequests,
        nextScheduledDeletionAt: nextRequest?.scheduledDeletionAt?.toISOString() ?? null,
      },
      alerts: { failedNotifications, expiredProcessingLeases },
    };
  }
}
