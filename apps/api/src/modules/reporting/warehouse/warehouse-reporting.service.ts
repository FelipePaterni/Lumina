import { Injectable } from "@nestjs/common";
import { EditionFormat, FulfillmentStatus, Prisma } from "@prisma/client";
import { PrismaService } from "../../../infrastructure/persistence/prisma.service.js";

@Injectable()
export class WarehouseReportingService {
  constructor(private readonly prisma: PrismaService) {}

  async summary() {
    const physicalOrderFilter: Prisma.OrderWhereInput = {
      items: { some: { format: EditionFormat.PHYSICAL, refunds: { none: { status: "PROCESSED" } } } },
    };
    const [editions, pending, picking, shipped, delivered] = await Promise.all([
      this.prisma.edition.findMany({
        where: { format: EditionFormat.PHYSICAL },
        select: { id: true, inventory: { select: { physicalStock: true } }, work: { select: { title: true } } },
        orderBy: [{ work: { title: "asc" } }, { id: "asc" }],
      }),
      this.prisma.order.count({ where: { ...physicalOrderFilter, fulfillmentStatus: FulfillmentStatus.PENDING } }),
      this.prisma.order.count({ where: { ...physicalOrderFilter, fulfillmentStatus: FulfillmentStatus.PICKING } }),
      this.prisma.order.count({ where: { ...physicalOrderFilter, fulfillmentStatus: FulfillmentStatus.SHIPPED } }),
      this.prisma.order.count({ where: { ...physicalOrderFilter, fulfillmentStatus: FulfillmentStatus.DELIVERED } }),
    ]);
    const alerts = editions.flatMap((edition) => {
      if (edition.inventory && edition.inventory.physicalStock > 0) return [];
      return [{
        editionId: edition.id,
        workTitle: edition.work.title,
        physicalStock: edition.inventory?.physicalStock ?? null,
        type: edition.inventory ? "OUT_OF_STOCK" as const : "INVENTORY_NOT_CONFIGURED" as const,
      }];
    });
    return {
      orders: { pending, picking, shipped, delivered },
      inventory: {
        editionCount: editions.length,
        totalUnits: editions.reduce((total, edition) => total + (edition.inventory?.physicalStock ?? 0), 0),
        outOfStockCount: alerts.length,
      },
      alerts,
    };
  }
}
