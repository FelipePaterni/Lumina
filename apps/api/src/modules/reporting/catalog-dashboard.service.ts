import { Injectable } from "@nestjs/common";
import { EditionFormat } from "@prisma/client";
import { PrismaService } from "../../infrastructure/persistence/prisma.service.js";

@Injectable()
export class CatalogDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async summary(now = new Date()) {
    const [editions, coupons] = await Promise.all([
      this.prisma.edition.findMany({
        where: { format: EditionFormat.DIGITAL },
        select: {
          id: true,
          work: { select: { title: true } },
          inventory: {
            select: { digitalLicenseLimit: true, digitalAllocated: true },
          },
        },
        orderBy: [{ work: { title: "asc" } }, { id: "asc" }],
      }),
      this.prisma.coupon.findMany({
        where: {
          isActive: true,
          validFrom: { lte: now },
          validUntil: { gt: now },
        },
        select: { usageCount: true, maxUses: true },
      }),
    ]);

    const finiteEditions = editions.filter(
      (edition) => edition.inventory?.digitalLicenseLimit !== null && edition.inventory !== null,
    );
    const exhausted = finiteEditions
      .filter((edition) => edition.inventory!.digitalAllocated >= edition.inventory!.digitalLicenseLimit!)
      .map((edition) => ({
        editionId: edition.id,
        workTitle: edition.work.title,
        allocated: edition.inventory!.digitalAllocated,
        limit: edition.inventory!.digitalLicenseLimit!,
      }));
    const finiteLimit = finiteEditions.reduce(
      (total, edition) => total + edition.inventory!.digitalLicenseLimit!,
      0,
    );
    const finiteAllocated = finiteEditions.reduce(
      (total, edition) => total + edition.inventory!.digitalAllocated,
      0,
    );
    const finiteAvailable = finiteEditions.reduce(
      (total, edition) => total + Math.max(
        0,
        edition.inventory!.digitalLicenseLimit! - edition.inventory!.digitalAllocated,
      ),
      0,
    );
    const allAllocated = editions.reduce(
      (total, edition) => total + (edition.inventory?.digitalAllocated ?? 0),
      0,
    );
    const usableCoupons = coupons.filter((coupon) => coupon.usageCount < coupon.maxUses);

    return {
      licenses: {
        digitalEditionCount: editions.length,
        allocated: allAllocated,
        finiteLimit,
        finiteAllocated,
        finiteAvailable,
        unlimitedEditionCount: editions.length - finiteEditions.length,
        exhausted,
      },
      coupons: {
        availableCount: usableCoupons.length,
        usageCount: usableCoupons.reduce((total, coupon) => total + coupon.usageCount, 0),
        quota: usableCoupons.reduce((total, coupon) => total + coupon.maxUses, 0),
        remainingUses: usableCoupons.reduce(
          (total, coupon) => total + coupon.maxUses - coupon.usageCount,
          0,
        ),
      },
    };
  }
}
