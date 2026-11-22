import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../infrastructure/persistence/prisma.service.js";

interface BestsellerRow {
  workId: string;
  workTitle: string;
  netUnits: bigint | number;
}

@Injectable()
export class AdminDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async summary() {
    const [payments, activeCustomers, confirmedOrders, bestsellers] = await Promise.all([
      this.prisma.payment.aggregate({
        _sum: { amountCents: true, refundedCents: true },
      }),
      this.prisma.user.count({ where: { role: "CUSTOMER", isActive: true } }),
      this.prisma.order.count(),
      this.prisma.$queryRaw<BestsellerRow[]>`
        SELECT
          w.id AS "workId",
          w.title AS "workTitle",
          SUM(oi.quantity - COALESCE(processed_refunds.quantity, 0)) AS "netUnits"
        FROM order_items AS oi
        INNER JOIN orders AS o ON o.id = oi.order_id
        INNER JOIN editions AS e ON e.id = oi.edition_id
        INNER JOIN works AS w ON w.id = e.work_id
        LEFT JOIN LATERAL (
          SELECT SUM(r.quantity) AS quantity
          FROM refunds AS r
          WHERE r.order_item_id = oi.id
            AND r.status::text = 'PROCESSED'
        ) AS processed_refunds ON TRUE
        WHERE o.status::text IN ('CONFIRMED', 'PARTIALLY_REFUNDED', 'REFUNDED')
        GROUP BY w.id, w.title
        HAVING SUM(oi.quantity - COALESCE(processed_refunds.quantity, 0)) > 0
        ORDER BY "netUnits" DESC, w.title ASC, w.id ASC
        LIMIT 5
      `,
    ]);

    const amountCents = payments._sum.amountCents ?? 0;
    const refundedCents = payments._sum.refundedCents ?? 0;
    const netSalesCents = amountCents - refundedCents;
    if (!Number.isSafeInteger(netSalesCents) || netSalesCents < 0) {
      throw new Error("Admin dashboard payment aggregate is outside the supported range");
    }

    return {
      netSalesCents,
      activeCustomers,
      confirmedOrders,
      bestsellers: bestsellers.map((row) => {
        const netUnits = Number(row.netUnits);
        if (!Number.isSafeInteger(netUnits) || netUnits < 1) {
          throw new Error("Admin dashboard bestseller aggregate is outside the supported range");
        }
        return { workId: row.workId, workTitle: row.workTitle, netUnits };
      }),
    };
  }
}
